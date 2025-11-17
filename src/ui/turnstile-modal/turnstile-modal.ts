import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
export class TurnstileModal implements AfterViewInit {
  protected readonly widgetContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('widgetContainer');
  protected readonly dialogElement = viewChild.required<ElementRef<HTMLDivElement>>('dialog');

  readonly widgetReady = output<HTMLElement>();
  readonly isLoading = signal(true);

  private previousActiveElement: HTMLElement | null = null;

  // emit container ref after view init so TurnstileService can move widget into it
  ngAfterViewInit(): void {
    const container = this.widgetContainer().nativeElement;
    this.widgetReady.emit(container);

    // Store currently focused element and trap focus in modal
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.focusDialog();
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  private focusDialog(): void {
    const dialog = this.dialogElement().nativeElement;
    dialog.focus();
  }

  restoreFocus(): void {
    this.previousActiveElement?.focus();
  }
}
