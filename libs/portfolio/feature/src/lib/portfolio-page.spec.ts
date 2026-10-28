import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, type Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { FeatureFlagService } from '@rapaglaz/shared/data-access';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { PortfolioPage } from './portfolio-page';

describe('PortfolioPage', () => {
  let fixture: ComponentFixture<PortfolioPage>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoTesting()],
    }).compileComponents();

    // the app initializer preloads translations in production; mirror
    // that so constructor-time translate() sees loaded values
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));

    fixture = TestBed.createComponent(PortfolioPage);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders core content with accessible cues', () => {
    const main = element.querySelector('main');
    expect(main).toBeInstanceOf(HTMLElement);

    const heroImage = main?.querySelector(
      '[data-testid="section-hero"] img',
    ) as HTMLImageElement | null;
    expect(heroImage).toBeInstanceOf(HTMLImageElement);
    expect(heroImage?.getAttribute('alt')?.trim()).toBeTruthy();

    const contactLinks = main?.querySelectorAll(
      '[data-testid="section-contact"] a[target="_blank"]',
    );
    expect(contactLinks?.length).toBeGreaterThanOrEqual(2);
    contactLinks?.forEach(link => {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('href')?.trim()).toBeTruthy();
    });

    const about = main?.querySelector('[data-testid="section-about"]');
    expect(about).toBeInstanceOf(HTMLElement);

    const skills = main?.querySelector('[data-testid="section-skills"]');
    const skillBadges = skills?.querySelectorAll('[data-testid="skill-badge"]');
    expect(skillBadges?.length).toBeGreaterThan(0);

    const certifications = main?.querySelector('[data-testid="section-certifications"]');
    const certificationCards = certifications?.querySelectorAll(
      '[data-testid="certification-card"]',
    );
    expect(certificationCards?.length).toBeGreaterThan(0);

    const languages = main?.querySelector('[data-testid="section-languages"]');
    const languageCards = languages?.querySelectorAll('[data-testid="language-card"]');
    expect(languageCards?.length).toBeGreaterThan(0);
  });

  it('sets social and description meta tags for the active language', () => {
    const head = TestBed.inject(DOCUMENT).head;
    const byProperty = (property: string): string | null | undefined =>
      head.querySelector(`meta[property="${property}"]`)?.getAttribute('content');
    const byName = (name: string): string | null | undefined =>
      head.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

    expect(byProperty('og:title')).toBe('Radek Glaz - Senior Frontend Engineer');
    expect(byProperty('og:site_name')).toBe('Radek Glaz');
    expect(byProperty('og:type')).toBe('website');
    expect(byProperty('og:url')).toBe('https://rapaglaz.de/en');
    expect(byProperty('og:image')).toBe('https://rapaglaz.de/images/IMG_2290-384.webp');
    expect(byProperty('og:description')).toContain('Frontend Engineer');
    expect(byName('description')).toContain('Frontend Engineer');
  });

  it('falls back to the default language for the meta tags when the active language is unknown', () => {
    fixture.destroy();
    TestBed.inject(TranslocoService).setActiveLang('fr');

    TestBed.createComponent(PortfolioPage).detectChanges();

    const head = TestBed.inject(DOCUMENT).head;
    expect(head.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://rapaglaz.de/en',
    );
    expect(head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
  });

  it('sets the document title and og:title from the role key in both languages', async () => {
    const transloco = TestBed.inject(TranslocoService);
    const title = TestBed.inject(Title);
    const ogTitle = (): string | null | undefined =>
      TestBed.inject(DOCUMENT)
        .head.querySelector('meta[property="og:title"]')
        ?.getAttribute('content');

    expect(title.getTitle()).toBe('Radek Glaz - Senior Frontend Engineer');
    expect(ogTitle()).toBe(title.getTitle());

    await firstValueFrom(transloco.load('de'));
    transloco.setActiveLang('de');
    transloco.setTranslation({ common: { role: 'Test role' } }, 'de', { merge: true });
    fixture.destroy();
    TestBed.createComponent(PortfolioPage).detectChanges();

    expect(title.getTitle()).toBe('Radek Glaz - Test role');
    expect(ogTitle()).toBe('Radek Glaz - Test role');
  });

  it('removes social meta tags on destroy', () => {
    fixture.destroy();

    const head = TestBed.inject(DOCUMENT).head;
    expect(head.querySelector('meta[property="og:title"]')).toBeNull();
    expect(head.querySelector('meta[property="og:image"]')).toBeNull();
    expect(head.querySelector('link[data-seo-id]')).toBeNull();
  });

  it('passes the content and the open-to-work flag to the sections', async () => {
    const openToWork = signal(false);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PortfolioPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        {
          provide: FeatureFlagService,
          useValue: { getFlagValue: (): Signal<boolean> => openToWork.asReadonly() },
        },
      ],
    });
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));
    const page = TestBed.createComponent(PortfolioPage);
    page.detectChanges();
    const host = page.nativeElement as HTMLElement;
    const count = (testId: string): number =>
      host.querySelectorAll(`[data-testid="${testId}"]`).length;

    expect(count('skill-badge')).toBe(28);
    expect(count('skill-badge-secondary')).toBe(2);
    expect(count('certification-card')).toBe(3);
    expect(count('contact-link')).toBe(3);
    expect(count('hero-badge-mobile')).toBe(0);

    openToWork.set(true);
    page.detectChanges();
    expect(count('hero-badge-mobile')).toBe(1);
  });
});
