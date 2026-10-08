import { afterNextRender, Component, ElementRef, output, signal, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-turnstile-modal',
  imports: [TranslocoModule],
  templateUrl: './turnstile-modal.html',
})
export class TurnstileModal {
  protected readonly widgetContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('widgetContainer');
  readonly widgetReady = output<HTMLElement>();
  readonly cancelled = output();
  readonly isLoading = signal(true);

  constructor() {
    afterNextRender(() => {
      const container = this.widgetContainer().nativeElement;
      this.widgetReady.emit(container);
    });
  }

  setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }
}
