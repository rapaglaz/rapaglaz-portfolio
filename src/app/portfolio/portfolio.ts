import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { About, Certifications, Contact, Hero, Languages, Skills } from '../features';
import { AVAILABLE_LANGS, type AvailableLang, DEFAULT_LANG } from '../utils/i18n';

const SITE_ORIGIN = 'https://rapaglaz.de';
const OG_LOCALE: Record<AvailableLang, string> = { de: 'de_DE', en: 'en_US' };
const SEO_LINK_ATTR = 'data-seo-id';

@Component({
  selector: 'app-portfolio',
  imports: [TranslocoPipe, Hero, About, Skills, Languages, Certifications, Contact],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main-content"
      class="focus:bg-primary focus:text-primary-content sr-only fixed top-4 left-4 z-100 rounded px-4 py-2 font-medium focus:not-sr-only focus:outline-none">
      {{ 'common.a11y.skipToContent' | transloco }}
    </a>
    <main
      id="main-content"
      class="min-h-screen"
      tabindex="-1">
      <app-hero />
      <app-about />
      <app-certifications />
      <app-skills />
      <app-languages />
      <app-contact />
    </main>
  `,
})
export class Portfolio {
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly activeLang = inject(TranslocoService).getActiveLang() as AvailableLang;

  constructor() {
    this.initSeoTags();
    this.destroyRef.onDestroy(() => this.cleanupSeoTags());
  }

  private initSeoTags(): void {
    const locale = OG_LOCALE[this.activeLang] ?? OG_LOCALE[DEFAULT_LANG];

    this.meta.updateTag({ property: 'og:locale', content: locale });

    for (const lang of AVAILABLE_LANGS) {
      if (lang !== this.activeLang) {
        this.meta.updateTag(
          { property: 'og:locale:alternate', content: OG_LOCALE[lang] },
          'property="og:locale:alternate"',
        );
      }
    }

    this.setLink('canonical', { rel: 'canonical', href: `${SITE_ORIGIN}/${this.activeLang}` });

    for (const lang of AVAILABLE_LANGS) {
      this.setLink(`alternate-${lang}`, {
        rel: 'alternate',
        hreflang: lang,
        href: `${SITE_ORIGIN}/${lang}`,
      });
    }

    this.setLink('alternate-x-default', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${SITE_ORIGIN}/${DEFAULT_LANG}`,
    });
  }

  private setLink(id: string, attrs: Record<string, string>): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>(`link[${SEO_LINK_ATTR}="${id}"]`);
    const el = existing ?? this.document.createElement('link');

    if (!existing) {
      el.setAttribute(SEO_LINK_ATTR, id);
      head.appendChild(el);
    }

    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }

  private cleanupSeoTags(): void {
    this.document.head.querySelectorAll(`link[${SEO_LINK_ATTR}]`).forEach(el => el.remove());
    this.meta.removeTag('property="og:locale"');
    this.meta.removeTag('property="og:locale:alternate"');
  }
}
