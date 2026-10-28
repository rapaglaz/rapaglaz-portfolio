import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { createScrollRevealState } from '../scroll-reveal/scroll-reveal-state';
import { ScrollRevealDirective } from '../scroll-reveal/scroll-reveal.directive';

@Component({
  selector: 'app-section-wrapper',
  imports: [TranslocoModule, ScrollRevealDirective],
  template: `
    <section
      [id]="sectionId()"
      [attr.data-testid]="'section-' + sectionId()"
      [attr.aria-labelledby]="sectionId() + '-heading'"
      class="bg-base-100 px-4 py-4"
      appScrollReveal
      (visibilityChange)="scrollReveal.onVisibilityChange($event)">
      <div class="container mx-auto max-w-5xl">
        <div
          class="border-primary/20 flex flex-col gap-4 border-t py-12 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12">
          <!-- Flex on mobile, so that the sticky title is bound to the whole section and not to its own grid row. -->
          <div
            class="bg-base-100 sticky top-(--navbar-height) z-10 py-3 lg:top-[calc(var(--navbar-height,7rem)+1.5rem)] lg:self-start lg:bg-transparent lg:py-0">
            <h2
              [id]="sectionId() + '-heading'"
              class="font-section-title text-primary animate-title text-base tracking-[0.12em] uppercase"
              [class.visible]="scrollReveal.isVisible()">
              {{ titleKey() | transloco }}
            </h2>
          </div>

          <div class="min-w-0">
            <ng-content />
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SectionWrapper {
  readonly sectionId = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly scrollReveal = createScrollRevealState();
}
