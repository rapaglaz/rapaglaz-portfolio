import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-turnstile-modal',
  imports: [TranslocoModule],
  templateUrl: './turnstile-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnstileModal {
  protected readonly widgetContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('widgetContainer');
  protected readonly dialogElement = viewChild.required<ElementRef<HTMLDivElement>>('dialog');

  readonly widgetReady = output<HTMLElement>();
  readonly isLoading = signal(true);

  private readonly document = inject(DOCUMENT);
  private previousActiveElement: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      const container = this.widgetContainer().nativeElement;
      this.widgetReady.emit(container);

      this.previousActiveElement = this.document.activeElement as HTMLElement;
      this.focusDialog();
    });
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  private focusDialog(): void {
    this.dialogElement().nativeElement.focus();
  }

  restoreFocus(): void {
    this.previousActiveElement?.focus();
  }
}
