import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { createScrollRevealState } from '../scroll-reveal/scroll-reveal-state';
import { ScrollRevealDirective } from '../scroll-reveal/scroll-reveal.directive';

@Component({
  selector: 'app-section-wrapper',
  imports: [TranslocoModule, ScrollRevealDirective],
  // Scroll-driven exit: while the sticky band is pushed under the navbar at the end of a section it
  // disappears. On small screens the band is clipped at the navbar edge, so the pill stays opaque and the
  // content never shows through it (an opacity fade would). From lg the bare title fades out instead.
  // Browsers without view timelines keep the band fully visible.
  styles: `
    /* 20px is pt-5 of the band, 54px adds the 34px pill: the clip edge follows the navbar's lower edge. */
    @keyframes title-band-clip {
      from {
        clip-path: inset(20px 0 0 0);
      }
      to {
        clip-path: inset(54px 0 0 0);
      }
    }

    @keyframes title-band-fade {
      to {
        opacity: 0;
      }
    }

    @supports (animation-timeline: view()) {
      @media (prefers-reduced-motion: no-preference) {
        .title-band {
          timeline-scope: --title-pill;
          animation: title-band-clip linear forwards;
          animation-timeline: --title-pill;
          animation-range: exit 0% exit 100%;
        }

        /* The inset moves the timeline edge to the lower edge of the navbar (below lg) or to where the title sticks. */
        .title-pill {
          view-timeline: --title-pill block;
          view-timeline-inset: var(--navbar-height, 7rem) 0;
        }

        @media (min-width: 1024px) {
          .title-band {
            animation-name: title-band-fade;
            animation-fill-mode: both;
          }

          .title-pill {
            view-timeline-inset: calc(var(--navbar-height, 7rem) + 1.5rem) 0;
          }
        }
      }
    }
  `,
  template: `
    <section
      #section
      [id]="sectionId()"
      [attr.data-testid]="'section-' + sectionId()"
      [attr.aria-labelledby]="sectionId() + '-heading'"
      class="bg-base-100 scroll-mt-(--navbar-height) px-4 py-2 lg:py-4"
      appScrollReveal
      (visibilityChange)="scrollReveal.onVisibilityChange($event)">
      <div class="container mx-auto max-w-5xl">
        <div
          class="border-primary/20 flex flex-col gap-4 py-6 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12 lg:border-t lg:py-12">
          <!-- Flex on mobile, so that the sticky title is bound to the whole section and not to its own grid row. -->
          <!--
            Blurred like the scrolled navbar. The band is fully opaque down to a few pixels below the
            pill (pt-5 + 34px pill + 6px = 60px) and fades out over the rest, so no text reaches the pill.
          -->
          <div
            class="title-band bg-base-100/85 sticky top-(--navbar-height) z-10 -mx-4 -mb-6 mask-[linear-gradient(to_bottom,#000_60px,transparent)] px-4 pt-5 pb-11 backdrop-blur-md lg:top-[calc(var(--navbar-height,7rem)+1.5rem)] lg:mx-0 lg:mb-0 lg:self-start lg:bg-transparent lg:mask-none lg:p-0 lg:backdrop-blur-none">
            <h2
              [id]="sectionId() + '-heading'"
              class="font-section-title text-primary animate-title text-base tracking-[0.12em] uppercase"
              [class.visible]="scrollReveal.isVisible()">
              <button
                type="button"
                class="title-pill bg-base-200 border-primary/35 focus-visible:outline-primary inline-block cursor-pointer rounded-full border px-3.5 py-1 uppercase shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                (click)="scrollToStart(section)">
                {{ titleKey() | transloco }}
              </button>
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

  // Runs only from a click, so it never executes during SSG; scroll-mt on the section keeps it below the navbar.
  protected scrollToStart(section: HTMLElement): void {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}
