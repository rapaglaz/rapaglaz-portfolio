import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './badge.css',
  host: {
    '[class]': 'sizeClasses()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
})
export class Badge {
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly badgeSize = input<BadgeSize>('md');

  protected readonly sizeClasses = computed(
    () => SIZE_CLASSES[this.badgeSize()] ?? SIZE_CLASSES.md,
  );
}
