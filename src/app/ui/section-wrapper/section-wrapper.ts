import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { createScrollRevealState, ScrollRevealDirective } from '../../utils/scroll';

@Component({
  selector: 'app-section-wrapper',
  imports: [TranslocoModule, ScrollRevealDirective],
  template: `
    <section
      [id]="sectionId()"
      [attr.data-testid]="'section-' + sectionId()"
      [attr.aria-labelledby]="sectionId() + '-heading'"
      class="bg-base-100 px-4 py-12"
      appScrollReveal
      (visibilityChange)="scrollReveal.onVisibilityChange($event)">
      <div class="container mx-auto max-w-5xl">
        <div
          class="border-primary/20 bg-base-200/30 section-shadow grid grid-cols-1 gap-4 rounded-lg border pr-4 pl-4 sm:pr-8 lg:grid-cols-[300px_1fr] lg:gap-30 lg:border-l-0 lg:pl-0">
          <div class="lg:border-primary/50 pt-8 pb-3 sm:py-8 lg:rounded-l-lg lg:border-l-4 lg:pl-4">
            <h2
              [id]="sectionId() + '-heading'"
              class="font-section-title text-ocean-outline animate-title mb-2 text-3xl uppercase"
              [class.visible]="scrollReveal.isVisible()">
              {{ titleKey() | transloco }}
            </h2>
          </div>

          <div class="pb-8 sm:py-8">
            <ng-content />
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionWrapper {
  readonly sectionId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly scrollReveal = createScrollRevealState();
}
