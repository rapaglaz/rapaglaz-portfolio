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
          class="border-primary/20 flex flex-col gap-4 py-12 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12 lg:border-t">
          <!-- Flex on mobile, so that the sticky title is bound to the whole section and not to its own grid row. -->
          <!--
            Blurred like the scrolled navbar. The band is fully opaque down to a few pixels below the
            pill (pt-5 + 34px pill + 6px = 60px) and fades out over the rest, so no text reaches the pill.
          -->
          <div
            class="bg-base-100/85 sticky top-(--navbar-height) z-10 -mx-4 mask-[linear-gradient(to_bottom,#000_60px,transparent)] px-4 pt-5 pb-8 backdrop-blur-md lg:top-[calc(var(--navbar-height,7rem)+1.5rem)] lg:mx-0 lg:self-start lg:bg-transparent lg:mask-none lg:p-0 lg:backdrop-blur-none">
            <h2
              [id]="sectionId() + '-heading'"
              class="font-section-title text-primary animate-title bg-base-200/90 border-primary/35 inline-block rounded-full border px-3.5 py-1 text-base tracking-[0.12em] uppercase shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
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
