import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { ToastContainer, ToastType } from '../../ui';

type SubscriptionLike = { unsubscribe(): void };

const NAVBAR_OFFSET = 'var(--navbar-height, 5rem)';
const DEFAULT_DURATION_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissSubscription: SubscriptionLike | null = null;

  show(message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION_MS): void {
    this.dismiss();

    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().top(NAVBAR_OFFSET).left('0').right('0'),
      width: '100%',
    });

    this.overlayRef = overlayRef;

    const componentRef = overlayRef.attach(new ComponentPortal(ToastContainer));
    componentRef.setInput('data', { message, type });

    this.dismissSubscription = componentRef.instance.dismissed.subscribe(() => this.dismiss());
    this.startDismissTimer(duration);
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
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    if (this.dismissSubscription) {
      this.dismissSubscription.unsubscribe();
      this.dismissSubscription = null;
    }

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private startDismissTimer(duration: number): void {
    if (duration <= 0) {
      return;
    }

    this.dismissTimer = setTimeout(() => this.dismiss(), duration);
  }
}
