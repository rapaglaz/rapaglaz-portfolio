import { computed, Directive, input } from '@angular/core';

export type ButtonVariant = 'ghost' | 'primary' | 'secondary' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Directive({
  selector: 'button[appButton]',
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled()',
    '[type]': '"button"',
    '[style.cursor]': 'disabled() ? "not-allowed" : "pointer"',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly circle = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  protected readonly classes = computed(() => {
    const classes = ['btn'];

    const variant = this.variant();
    if (variant === 'ghost') classes.push('btn-ghost');
    else if (variant === 'primary') classes.push('btn-primary');
    else if (variant === 'secondary') classes.push('btn-secondary');
    else if (variant === 'link') classes.push('btn-link');

    const size = this.size();
    if (size === 'sm') classes.push('btn-sm');
    else if (size === 'lg') classes.push('btn-lg');

    if (this.circle()) classes.push('btn-circle');

    return classes.join(' ');
  });
}
