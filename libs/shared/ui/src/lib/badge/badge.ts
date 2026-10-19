import { Component, computed, input } from '@angular/core';

export type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

// Utilities on the host instead of @apply: a library stylesheet cannot @reference the app styles
const BASE_CLASSES = [
  'rounded-full border font-bold',
  'bg-primary/10 shadow-primary/15 border-slate-700 text-slate-900 opacity-100 shadow-lg',
  'dark:shadow-primary/5 dark:border-emerald-200/80 dark:text-emerald-300/80 dark:opacity-80 dark:shadow-xl',
].join(' ');

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
  xl: 'px-5 py-2.5 text-lg',
};

@Component({
  selector: 'app-badge',
  imports: [],
  template: `<ng-content />`,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
})
export class Badge {
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly badgeSize = input<BadgeSize>('md');

  protected readonly hostClasses = computed(
    () => `${BASE_CLASSES} ${SIZE_CLASSES[this.badgeSize()] ?? SIZE_CLASSES.md}`,
  );
}
