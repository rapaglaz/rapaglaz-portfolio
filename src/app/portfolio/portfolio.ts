import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { About, Certifications, Contact, Hero, Languages, Skills } from '../features';
import { AVAILABLE_LANGS, type AvailableLang, DEFAULT_LANG } from '../utils/i18n';

const SITE_ORIGIN = 'https://rapaglaz.de';
const OG_LOCALE: Record<AvailableLang, string> = { de: 'de_DE', en: 'en_US' };
const SEO_LINK_ATTR = 'data-seo-id';
const SEO_ROLE = 'Frontend Engineer';
const SEO_IMAGE = `${SITE_ORIGIN}/images/IMG_2290-384.webp`;

@Component({
  selector: 'app-portfolio',
  imports: [TranslocoPipe, Hero, About, Skills, Languages, Certifications, Contact],

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
  private readonly transloco = inject(TranslocoService);
  private readonly activeLang = this.transloco.getActiveLang() as AvailableLang;

  constructor() {
    this.initSeoTags();
    this.destroyRef.onDestroy(() => this.cleanupSeoTags());
  }

  private initSeoTags(): void {
    const locale = OG_LOCALE[this.activeLang] ?? OG_LOCALE[DEFAULT_LANG];
    // the app initializer loads the active language before anything
    // renders, so synchronous translate() is safe here
    const name = `${this.transloco.translate('common.firstName')} ${this.transloco.translate('common.lastName')}`;
    const title = `${name} - ${SEO_ROLE}`;
    const description = this.transloco.translate<string>('portfolio.hero.description');
    const pageUrl = `${SITE_ORIGIN}/${this.activeLang}`;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:image', content: SEO_IMAGE });
    this.meta.updateTag({ property: 'og:site_name', content: name });
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
    // name="description" stays: it pre-exists in index.html and is only updated
    const ogProperties = [
      'og:title',
      'og:description',
      'og:type',
      'og:url',
      'og:image',
      'og:site_name',
      'og:locale',
      'og:locale:alternate',
    ];
    for (const property of ogProperties) {
      this.meta.removeTag(`property="${property}"`);
    }
  }
}
