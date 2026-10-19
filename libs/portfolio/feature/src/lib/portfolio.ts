import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { About, Certifications, Contact, Hero, Languages, Skills } from '@rapaglaz/portfolio/ui';
import { FeatureFlagService } from '@rapaglaz/shared/data-access';
import {
  AVAILABLE_LANGS,
  CONTACT_ITEMS,
  DEFAULT_LANG,
  type AvailableLang,
} from '@rapaglaz/shared/util';
import { CERTIFICATIONS } from './content/certifications.content';
import { SKILL_CATEGORIES } from './content/skills.content';

const SITE_ORIGIN = 'https://rapaglaz.de';
const OG_LOCALE: Record<AvailableLang, string> = { de: 'de_DE', en: 'en_US' };
const SEO_LINK_ATTR = 'data-seo-id';
const SEO_ROLE = 'Senior Frontend Engineer (Angular)';
const SEO_IMAGE = `${SITE_ORIGIN}/images/IMG_2290-384.webp`;

@Component({
  selector: 'app-portfolio',
  imports: [Hero, About, Skills, Languages, Certifications, Contact],

  template: `
    <main
      id="main-content"
      class="focus-visible:outline-primary min-h-screen focus-visible:outline-2 focus-visible:-outline-offset-2"
      tabindex="-1">
      <app-hero [openToWork]="openToWork()" />
      <app-about />
      <app-certifications [items]="certifications" />
      <app-skills [categories]="skillCategories" />
      <app-languages />
      <app-contact [items]="contactItems" />
    </main>
  `,
})
export class Portfolio {
  protected readonly openToWork = inject(FeatureFlagService).getFlagValue('openToWork');
  protected readonly certifications = CERTIFICATIONS;
  protected readonly skillCategories = SKILL_CATEGORIES;
  protected readonly contactItems = CONTACT_ITEMS;

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
