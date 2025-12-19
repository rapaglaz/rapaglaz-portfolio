import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  PLATFORM_ID,
} from '@angular/core';
import { getBrowserCultureLang } from '@jsverse/transloco';
import { defer, finalize, Observable, of, shareReplay, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TurnstileModal } from '../../ui';
import { LoggerService } from '../logger/logger.service';

type TurnstileAPI = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      size?: 'compact' | 'normal' | 'flexible';
      appearance?: 'always' | 'execute' | 'interaction-only';
      execution?: 'render' | 'execute';
      language?: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'before-interactive-callback'?: () => void;
    },
  ): string;
  remove(widgetId?: string): void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileAPI };

type WidgetContext = {
  widgetId: string;
  container: HTMLElement | null;
  modalRef: ReturnType<typeof createComponent<TurnstileModal>> | null;
  modalSubscription: { unsubscribe(): void } | null;
};

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly logger = inject(LoggerService);

  private scriptLoad$: Observable<void> | null = null;

  getToken$(siteKey: string): Observable<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Turnstile is only available in the browser'));
    }

    return this.loadScript().pipe(switchMap(() => this.renderWidget(siteKey)));
  }

  private loadScript(): Observable<void> {
    if (this.scriptLoad$) return this.scriptLoad$;

    const win: TurnstileWindow | null = this.document.defaultView;
    if (!win) {
      return throwError(() => new Error('Window not available'));
    }

    if (win.turnstile) {
      this.scriptLoad$ = of(undefined).pipe(shareReplay(1));
      return this.scriptLoad$;
    }

    const script = this.document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    if (!this.document.head) {
      return throwError(() => new Error('document.head not available'));
    }

    this.document.head.appendChild(script);

    this.scriptLoad$ = new Observable<void>(subscriber => {
      script.onload = (): void => {
        if (win.turnstile) {
          subscriber.next();
          subscriber.complete();
        } else {
          subscriber.error(new Error('Turnstile API not available'));
        }
      };
      script.onerror = (): void => subscriber.error(new Error('Failed to load Turnstile script'));
    }).pipe(
      catchError(err => {
        this.scriptLoad$ = null;
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    return this.scriptLoad$;
  }

  private renderWidget(siteKey: string): Observable<string> {
    return defer(() => {
      const win: TurnstileWindow | null = this.document.defaultView;
      if (!win?.turnstile || !this.document.body) {
        return throwError(() => new Error('Turnstile not available'));
      }

      const turnstile = win.turnstile;
      const context = this.createWidgetContext();
      context.container = this.createHiddenContainer();

      return new Observable<string>(subscriber => {
        if (!context.container) {
          subscriber.error(new Error('Container not initialized'));
          return;
        }

        try {
          context.widgetId = turnstile.render(context.container, {
            sitekey: siteKey,
            size: 'normal',
            appearance: 'interaction-only',
            execution: 'render',
            language: getBrowserCultureLang().toLowerCase(),
            callback: token => {
              subscriber.next(token);
              subscriber.complete();
            },
            'error-callback': () => subscriber.error(new Error('Turnstile verification failed')),
            'before-interactive-callback': () => {
              this.showModalWithWidget(context);
            },
          });
        } catch (error) {
          subscriber.error(new Error(`Failed to render widget: ${error}`));
        }
      }).pipe(finalize(() => this.cleanupWidget(win.turnstile, context)));
    });
  }

  private createHiddenContainer(): HTMLElement {
    const body = this.document.body;
    if (!body) {
      throw new Error('document.body not available');
    }

    const container = this.document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.visibility = 'hidden';
    body.appendChild(container);
    return container;
  }

  private createWidgetContext(): WidgetContext {
    return {
      widgetId: '',
      container: null,
      modalRef: null,
      modalSubscription: null,
    };
  }

  private showModalWithWidget(context: WidgetContext): void {
    if (context.modalRef || !context.container) return;

    const body = this.document.body;
    if (!body) return;

    context.modalRef = createComponent(TurnstileModal, {
      environmentInjector: this.injector,
    });

    this.appRef.attachView(context.modalRef.hostView);
    body.appendChild(context.modalRef.location.nativeElement);

    const container = context.container;
    context.modalSubscription = context.modalRef.instance.widgetReady.subscribe(
      (modalContainer: HTMLElement) => {
        this.moveWidgetToModal(container, modalContainer);
        context.modalRef?.instance.setLoading(false);
      },
    );
  }

  private moveWidgetToModal(widgetContainer: HTMLElement, modalContainer: HTMLElement): void {
    widgetContainer.style.position = '';
    widgetContainer.style.left = '';
    widgetContainer.style.visibility = '';
    modalContainer.appendChild(widgetContainer);
  }

  private cleanupWidget(turnstile: TurnstileAPI | undefined, context: WidgetContext): void {
    if (context.widgetId && turnstile) {
      try {
        turnstile.remove(context.widgetId);
      } catch (error) {
        this.logger.warn('Failed to remove Turnstile widget', error);
      }
    }

    if (context.modalSubscription) {
      context.modalSubscription.unsubscribe();
    }

    if (context.container) {
      context.container.parentNode?.removeChild(context.container);
    }

    if (context.modalRef) {
      context.modalRef.instance.restoreFocus();
      const modalElement = context.modalRef.location.nativeElement;
      modalElement?.parentNode?.removeChild(modalElement);
      this.appRef.detachView(context.modalRef.hostView);
      context.modalRef.destroy();
    }
  }
}
