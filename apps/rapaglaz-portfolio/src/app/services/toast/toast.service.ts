import type { Overlay, OverlayRef } from '@angular/cdk/overlay';
import type { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ComponentRef, DestroyRef, inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { LoggerService } from '@rapaglaz/shared/util';
import { fromEvent, Subscription } from 'rxjs';
import { ToastContainer, ToastType } from '../../ui';

const NAVBAR_OFFSET = 'var(--navbar-height, 5rem)';

type PendingToast = { message: string; type: ToastType };

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  // CDK overlay and portal load with the first toast, not with the initial bundle
  private overlay: Overlay | null = null;
  private portal: typeof ComponentPortal | null = null;
  private overlayLoad: Promise<void> | null = null;
  private pending: PendingToast | null = null;
  private overlayRef: OverlayRef | null = null;
  private componentRef: ComponentRef<ToastContainer> | null = null;
  private subscriptions = new Subscription();
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.dismiss());
  }

  // Resolves once the toast is rendered. Only the first toast waits for the overlay chunk.
  // Toasts stay until dismissed.
  show(message: string, type: ToastType = 'info'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    if (!this.componentRef && !this.pending) {
      const activeElement = this.document.activeElement;
      this.previousActiveElement = activeElement instanceof HTMLElement ? activeElement : null;
    }
    // the latest message wins if several arrive while the overlay is loading
    this.pending = { message, type };

    if (this.overlay) {
      this.renderPending();
      return Promise.resolve();
    }
    return this.loadOverlay().then(
      () => this.renderPending(),
      (error: unknown) => this.logger.error('Failed to load the toast overlay', error),
    );
  }

  error(message: string): Promise<void> {
    return this.show(message, 'error');
  }

  dismiss(): void {
    this.pending = null;
    const restoreFocus = this.overlayRef?.overlayElement.contains(this.document.activeElement);
    const previousActiveElement = this.previousActiveElement;

    this.subscriptions.unsubscribe();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.componentRef = null;
    this.previousActiveElement = null;

    if (restoreFocus && previousActiveElement?.isConnected) {
      previousActiveElement.focus({ preventScroll: true });
    }
  }

  private loadOverlay(): Promise<void> {
    this.overlayLoad ??= import('./toast-overlay').then(
      ({ Overlay, ComponentPortal }) => {
        this.overlay = this.injector.get(Overlay);
        this.portal = ComponentPortal;
      },
      (error: unknown) => {
        // allow a later toast to retry, for example after a failed chunk request
        this.overlayLoad = null;
        throw error;
      },
    );
    return this.overlayLoad;
  }

  private renderPending(): void {
    const pending = this.pending;
    if (!pending || !this.overlay || !this.portal) return;
    this.pending = null;

    if (!this.componentRef) {
      const overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().top(NAVBAR_OFFSET).left('0').right('0'),
        width: '100%',
        panelClass: 'pointer-events-none!',
      });

      this.overlayRef = overlayRef;
      this.componentRef = overlayRef.attach(new this.portal(ToastContainer));
      this.subscriptions = new Subscription();
      this.subscriptions.add(this.componentRef.instance.dismissed.subscribe(() => this.dismiss()));
      this.trackFocusOrigin(overlayRef.overlayElement);
    }

    this.componentRef.setInput('data', { message: pending.message, type: pending.type });
  }

  // Remembers where focus came from, so dismissing from inside the toast can return it there
  private trackFocusOrigin(element: HTMLElement): void {
    this.subscriptions.add(
      fromEvent<FocusEvent>(element, 'focusin').subscribe(event => {
        if (event.relatedTarget instanceof HTMLElement && !element.contains(event.relatedTarget)) {
          this.previousActiveElement = event.relatedTarget;
        }
      }),
    );
  }
}
