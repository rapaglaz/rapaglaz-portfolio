import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-portfolio',
  imports: [Navbar, RouterLink, RouterOutlet, Footer, TranslocoPipe],
  template: `
    <a
      [routerLink]="[]"
      fragment="main-content"
      queryParamsHandling="preserve"
      (click)="skipToContent($event)"
      class="bg-primary text-primary-content focus:outline-primary fixed top-4 left-4 z-100 -translate-y-[calc(100%+1rem)] rounded px-4 py-2 font-medium focus:translate-y-0 focus:outline-2 focus:outline-offset-2">
      {{ 'common.a11y.skipToContent' | transloco }}
    </a>
    <app-navbar />
    <div class="min-h-screen">
      <router-outlet />
    </div>
    <app-footer />
  `,
})
// Glues the page together: the navbar and footer stay outside the router outlet, so a language
// switch (a new route) recreates only the page
export class Portfolio {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  protected skipToContent(event: MouseEvent): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const main = this.document.getElementById('main-content');
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
