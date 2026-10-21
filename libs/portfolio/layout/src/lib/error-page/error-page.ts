import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { injectActiveLang } from '@rapaglaz/shared/util';

type ErrorKind = 'notFound' | 'failed';

const ROBOTS_SELECTOR = 'name="robots"';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, TranslocoPipe],
  template: `
    <main
      id="main-content"
      class="focus-visible:outline-primary flex min-h-screen items-center justify-center px-6 py-24 text-center focus-visible:outline-2 focus-visible:-outline-offset-2"
      tabindex="-1">
      <div class="mx-auto max-w-xl animate-[fadeInUp_0.5s_ease-out_both]">
        <h1
          data-testid="error-heading"
          class="text-ocean-outline font-section-title text-4xl tracking-[0.075em] sm:text-5xl">
          @if (kind === 'failed') {
            {{ 'common.error.failed.title' | transloco }}
          } @else {
            {{ 'common.error.notFound.title' | transloco }}
          }
        </h1>
        <p
          data-testid="error-message"
          class="mt-6 text-xl leading-relaxed font-medium text-(--color-text-muted)">
          @if (kind === 'failed') {
            {{ 'common.error.failed.message' | transloco }}
          } @else {
            {{ 'common.error.notFound.message' | transloco }}
          }
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          @if (kind === 'failed') {
            <button
              type="button"
              data-testid="error-reload"
              class="btn btn-primary focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-4"
              (click)="reload()">
              {{ 'common.error.reload' | transloco }}
            </button>
            <a
              data-testid="error-home"
              class="btn btn-outline btn-primary focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-4"
              [routerLink]="['/', lang()]">
              {{ 'common.error.home' | transloco }}
            </a>
          } @else {
            <a
              data-testid="error-home"
              class="btn btn-primary focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-4"
              [routerLink]="['/', lang()]">
              {{ 'common.error.home' | transloco }}
            </a>
          }
        </div>
      </div>
    </main>
  `,
})
// Shown instead of the portfolio page for an unknown URL or a failed navigation. The router tells
// which one through the route data, so both share one layout and the navbar and footer stay.
export class ErrorPage {
  protected readonly lang = injectActiveLang();
  protected readonly kind: ErrorKind =
    inject(ActivatedRoute).snapshot.data['kind'] === 'failed' ? 'failed' : 'notFound';

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const previousTitle = this.title.getTitle();
    const previousRobots = this.meta.getTag(ROBOTS_SELECTOR)?.content;

    // the app initializer loads the active language before anything renders, so synchronous
    // translate() is safe here
    const heading =
      this.kind === 'failed'
        ? this.transloco.translate('common.error.failed.title')
        : this.transloco.translate('common.error.notFound.title');
    const name = `${this.transloco.translate('common.firstName')} ${this.transloco.translate('common.lastName')}`;
    this.title.setTitle(`${heading} | ${name}`);
    this.meta.updateTag({ name: 'robots', content: 'noindex' });

    // the portfolio page comes back through the same router outlet, so it must not stay hidden
    inject(DestroyRef).onDestroy(() => {
      this.title.setTitle(previousTitle);
      if (previousRobots === undefined) {
        this.meta.removeTag(ROBOTS_SELECTOR);
      } else {
        this.meta.updateTag({ name: 'robots', content: previousRobots });
      }
    });
  }

  protected reload(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.defaultView?.location.reload();
    }
  }
}
