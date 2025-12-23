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

export type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
  xl: 'px-5 py-2.5 text-lg',
};

@Component({
  selector: 'app-badge',
  imports: [],
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'button',
    tabindex: '0',
    '[class]': 'badgeClasses()',
    '[attr.aria-label]': 'ariaLabel()',
    '(click)': 'handleClick($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.space)': 'handleKeydown($event)',
  },
})
export class Badge {
  private readonly elementRef = inject(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);

  readonly ariaLabel = input<string>('Badge');
  readonly badgeSize = input<BadgeSize>('md');
  readonly clicked = output<MouseEvent>();

  private readonly focusEffect = effect(onCleanup => {
    this.focusMonitor.monitor(this.elementRef, true);
    onCleanup(() => this.focusMonitor.stopMonitoring(this.elementRef));
  });

  protected badgeClasses(): string {
    const sizeClasses = SIZE_CLASSES[this.badgeSize()] ?? SIZE_CLASSES.md;

    return [
      'text-primary bg-primary/10 border-primary/60 focus:outline-primary',
      'cursor-pointer rounded-full border font-bold transition duration-300 hover:scale-105 hover:opacity-80 focus:outline-2 focus:outline-offset-2',
      sizeClasses,
    ].join(' ');
  }

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
