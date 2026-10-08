import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  catchError,
  defer,
  finalize,
  Observable,
  of,
  retry,
  shareReplay,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { TurnstileModal } from '../../ui';
import { DEFAULT_LANG, injectActiveLang, isAvailableLang } from '../../utils/i18n';
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
  dialogRef: DialogRef<undefined, TurnstileModal> | null;
  subscriptions: Subscription;
};

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly dialog = inject(Dialog);
  private readonly activeLang = injectActiveLang();
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly logger = inject(LoggerService);

  private static readonly SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

  private scriptLoad$: Observable<void> | null = null;

  getToken$(siteKey: string, restoreFocus?: HTMLElement): Observable<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Turnstile is only available in the browser'));
    }

    return this.loadScript().pipe(switchMap(() => this.renderWidget(siteKey, restoreFocus)));
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

    this.scriptLoad$ = defer(() => {
      this.document.head
        .querySelector<HTMLScriptElement>(`script[src="${TurnstileService.SCRIPT_SRC}"]`)
        ?.remove();

      const script = this.document.createElement('script');
      script.src = TurnstileService.SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      this.document.head.appendChild(script);

      return new Observable<void>(subscriber => {
        script.onload = (): void => {
          if (win.turnstile) {
            subscriber.next();
            subscriber.complete();
          } else {
            subscriber.error(new Error('Turnstile API not available'));
          }
        };
        script.onerror = (): void => subscriber.error(new Error('Failed to load Turnstile script'));
      });
    }).pipe(
      retry({ count: 2 }),
      catchError(err => {
        this.scriptLoad$ = null;
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    return this.scriptLoad$;
  }

  private renderWidget(siteKey: string, restoreFocus?: HTMLElement): Observable<string> {
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
          const language = this.activeLang();
          context.widgetId = turnstile.render(context.container, {
            sitekey: siteKey,
            size: 'compact',
            appearance: 'interaction-only',
            execution: 'render',
            language: isAvailableLang(language) ? language : DEFAULT_LANG,
            callback: token => {
              subscriber.next(token);
              subscriber.complete();
            },
            'error-callback': () => subscriber.error(new Error('Turnstile verification failed')),
            'before-interactive-callback': () => {
              if (!subscriber.closed) {
                this.showModalWithWidget(context, () => subscriber.complete(), restoreFocus);
              }
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
      dialogRef: null,
      subscriptions: new Subscription(),
    };
  }

  private showModalWithWidget(
    context: WidgetContext,
    onCancel: () => void,
    restoreFocus?: HTMLElement,
  ): void {
    if (context.dialogRef || !context.container) return;

    const dialogRef = this.dialog.open<undefined, unknown, TurnstileModal>(TurnstileModal, {
      ariaModal: true,
      ariaLabelledBy: 'turnstile-modal-title',
      ariaDescribedBy: 'turnstile-modal-description',
      autoFocus: '[data-turnstile-close]',
      restoreFocus: restoreFocus ?? true,
      width: 'calc(100% - 2rem)',
      maxWidth: '28rem',
      backdropClass: ['cdk-overlay-dark-backdrop', 'backdrop-blur-sm'],
    });

    context.dialogRef = dialogRef;
    const container = context.container;
    context.subscriptions.add(
      dialogRef.componentInstance?.widgetReady.subscribe((modalContainer: HTMLElement) => {
        this.moveWidgetToModal(container, modalContainer);
        dialogRef.componentInstance?.setLoading(false);
      }),
    );
    context.subscriptions.add(
      dialogRef.componentInstance?.cancelled.subscribe(() => dialogRef.close()),
    );
    context.subscriptions.add(
      dialogRef.closed.subscribe(() => {
        context.dialogRef = null;
        onCancel();
      }),
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

    context.subscriptions.unsubscribe();

    if (context.container) {
      context.container.parentNode?.removeChild(context.container);
    }

    context.dialogRef?.close();
    context.dialogRef = null;
  }
}
