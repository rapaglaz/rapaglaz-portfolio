import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ComponentRef, DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { ToastContainer, ToastType } from '../../ui';

const NAVBAR_OFFSET = 'var(--navbar-height, 5rem)';
const DEFAULT_DURATION_MS = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private overlayRef: OverlayRef | null = null;
  private componentRef: ComponentRef<ToastContainer> | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions = new Subscription();
  private previousActiveElement: HTMLElement | null = null;
  private duration = DEFAULT_DURATION_MS;
  private hasFocus = false;
  private isHovered = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.dismiss());
  }

  show(message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION_MS): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.componentRef) {
      const activeElement = this.document.activeElement;
      this.previousActiveElement = activeElement instanceof HTMLElement ? activeElement : null;
      const overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().top(NAVBAR_OFFSET).left('0').right('0'),
        width: '100%',
        panelClass: 'pointer-events-none!',
      });

      this.overlayRef = overlayRef;
      this.componentRef = overlayRef.attach(new ComponentPortal(ToastContainer));
      this.subscriptions = new Subscription();
      this.subscriptions.add(this.componentRef.instance.dismissed.subscribe(() => this.dismiss()));
      this.trackInteraction(overlayRef.overlayElement);
    }

    this.componentRef.setInput('data', { message, type });
    this.duration = duration;
    this.startDismissTimer();
  }

  success(message: string, duration: number = DEFAULT_DURATION_MS): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = DEFAULT_DURATION_MS): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration: number = DEFAULT_DURATION_MS): void {
    this.show(message, 'info', duration);
  }

  dismiss(): void {
    this.clearDismissTimer();
    const restoreFocus = this.overlayRef?.overlayElement.contains(this.document.activeElement);
    const previousActiveElement = this.previousActiveElement;

    this.subscriptions.unsubscribe();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.componentRef = null;
    this.previousActiveElement = null;
    this.hasFocus = false;
    this.isHovered = false;

    if (restoreFocus && previousActiveElement?.isConnected) {
      previousActiveElement.focus({ preventScroll: true });
    }
  }

  private trackInteraction(element: HTMLElement): void {
    this.subscriptions.add(
      fromEvent(element, 'mouseenter').subscribe(() => {
        this.isHovered = true;
        this.startDismissTimer();
      }),
    );
    this.subscriptions.add(
      fromEvent(element, 'mouseleave').subscribe(() => {
        this.isHovered = false;
        this.startDismissTimer();
      }),
    );
    this.subscriptions.add(
      fromEvent<FocusEvent>(element, 'focusin').subscribe(event => {
        if (event.relatedTarget instanceof HTMLElement && !element.contains(event.relatedTarget)) {
          this.previousActiveElement = event.relatedTarget;
        }
        this.hasFocus = true;
        this.startDismissTimer();
      }),
    );
    this.subscriptions.add(
      fromEvent<FocusEvent>(element, 'focusout').subscribe(event => {
        if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
        this.hasFocus = false;
        this.startDismissTimer();
      }),
    );
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  private startDismissTimer(): void {
    this.clearDismissTimer();
    if (this.duration <= 0 || this.hasFocus || this.isHovered) return;

    this.dismissTimer = setTimeout(() => this.dismiss(), this.duration);
  }
}
