import { FocusMonitor } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  template: `
    <div
      class="text-primary bg-primary/10 border-primary/60 focus:outline-primary cursor-pointer rounded-full border px-3 py-1 text-sm font-bold transition duration-300 hover:scale-105 hover:opacity-80 focus:outline-2 focus:outline-offset-2"
      role="button"
      tabindex="0"
      [attr.aria-label]="ariaLabel()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'handleClick($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.space)': 'handleKeydown($event)',
  },
})
export class Badge {
  private readonly elementRef = inject(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);

  readonly ariaLabel = input<string>('Badge');
  readonly clicked = output<MouseEvent>();

  private readonly focusEffect = effect(onCleanup => {
    this.focusMonitor.monitor(this.elementRef, true);
    onCleanup(() => this.focusMonitor.stopMonitoring(this.elementRef));
  });

  protected handleClick(event: MouseEvent): void {
    this.clicked.emit(event);
  }

  protected handleKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    const mouseEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    this.clicked.emit(mouseEvent);
  }
}
