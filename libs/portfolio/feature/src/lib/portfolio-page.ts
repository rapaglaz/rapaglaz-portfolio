import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { About, Certifications, Contact, Hero, Languages, Skills } from '@rapaglaz/portfolio/ui';
import { CONTACT_ITEMS } from '@rapaglaz/portfolio/util';
import { FeatureFlagService, SITE_ORIGIN } from '@rapaglaz/shared/data-access';
import {
  AVAILABLE_LANGS,
  DEFAULT_LANG,
  isAvailableLang,
  type AvailableLang,
} from '@rapaglaz/shared/util';
import { CERTIFICATIONS } from './content/certifications.content';
import { SKILL_CATEGORIES } from './content/skills.content';

const OG_LOCALE: Record<AvailableLang, string> = { de: 'de_DE', en: 'en_US' };
const SEO_LINK_ATTR = 'data-seo-id';
const SEO_IMAGE = `${SITE_ORIGIN}/images/IMG_2290-384.webp`;

function toAvailableLang(lang: string): AvailableLang {
  return isAvailableLang(lang) ? lang : DEFAULT_LANG;
}

@Component({
  selector: 'app-portfolio-page',
  imports: [Hero, About, Skills, Languages, Certifications, Contact],
  // Scroll-driven transition from the hero to the sections; without support nothing changes.
  // Below lg: crossfade. The sections are pulled up by half of the free space under the centered hero
  // content (assumed 44rem high), but by 3rem at least.
  // From lg: the hero stays pinned and the sections slide over it as an opaque curtain, so the first section
  // is reached after a short scroll and no text is half transparent.
  styles: `
    @keyframes hero-fade {
      to {
        opacity: 0;
      }
    }

    @keyframes sections-reveal {
      from {
        opacity: 0;
      }
    }

    @keyframes hero-recede {
      to {
        opacity: 0.25;
        transform: scale(0.94);
      }
    }

    /* First half: arrival at the navbar. Second half: the shift shrinks with the scroll, so the sections hold still. */
    @keyframes sections-slide-in {
      0% {
        transform: translateY(calc(60svh - var(--navbar-height, 7rem)));
        animation-timing-function: cubic-bezier(0.3, 0.6, 0.4, 1);
      }

      50% {
        transform: translateY(-20svh);
        animation-timing-function: linear;
      }

      100% {
        transform: translateY(0);
      }
    }

    /* One wrapper for all sections: separately moved sections leave hairline gaps at fractional offsets. */
    @supports (animation-timeline: scroll()) {
      @media (prefers-reduced-motion: no-preference) {
        main > * {
          display: block;
          animation-timeline: scroll(root block);
          animation-timing-function: linear;
          animation-fill-mode: both;
        }

        @media (max-width: 1023px) {
          main > * {
            animation-range: 30svh 70svh;
          }

          app-hero {
            animation-name: hero-fade;
          }

          main > .sections {
            margin-top: var(--hero-pull-up, min(calc(22rem - 50svh), -3rem));
            animation-name: sections-reveal;
          }
        }

        @media (min-width: 1024px) {
          main > app-hero {
            position: sticky;
            top: 0;
            animation-name: hero-recede;
            animation-range: 0 20svh;
          }

          /* Above the pinned hero */
          main > .sections {
            position: relative;
            z-index: 1;
            margin-top: calc(var(--navbar-height, 7rem) - 60svh);
            animation-name: sections-slide-in;
            animation-range: 0 40svh;
          }

          /* Soft upper edge of the curtain */
          main > .sections::before {
            content: '';
            position: absolute;
            inset-inline: 0;
            bottom: 100%;
            height: 8rem;
            background: linear-gradient(to bottom, transparent, var(--color-base-100));
            pointer-events: none;
          }
        }
      }
    }
  `,
  template: `
    <main
      id="main-content"
      class="focus-visible:outline-primary min-h-screen focus-visible:outline-2 focus-visible:-outline-offset-2"
      tabindex="-1">
      <app-hero [openToWork]="openToWork()" />
      <div class="sections">
        <app-about />
        <app-certifications [items]="certifications" />
        <app-skills [categories]="skillCategories" />
        <app-languages />
        <app-contact [items]="contactItems" />
      </div>
    </main>
  `,
})
export class PortfolioPage {
  protected readonly openToWork = inject(FeatureFlagService).getFlagValue('openToWork');
  protected readonly certifications = CERTIFICATIONS;
  protected readonly skillCategories = SKILL_CATEGORIES;
  protected readonly contactItems = CONTACT_ITEMS;

  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);
  private readonly activeLang = toAvailableLang(this.transloco.getActiveLang());

  constructor() {
    this.initSeoTags();
    this.destroyRef.onDestroy(() => this.cleanupSeoTags());
  }

  private initSeoTags(): void {
    const locale = OG_LOCALE[this.activeLang];
    // the app initializer loads the active language before anything
    // renders, so synchronous translate() is safe here
    const name = `${this.transloco.translate('common.firstName')} ${this.transloco.translate('common.lastName')}`;
    const title = `${name} - ${this.transloco.translate('common.role')}`;
    const description = this.transloco.translate<string>('portfolio.hero.description');
    const pageUrl = `${SITE_ORIGIN}/${this.activeLang}`;

    this.titleService.setTitle(title);
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
