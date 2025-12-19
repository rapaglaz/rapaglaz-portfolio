import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../testing';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  let fixture: ComponentFixture<Portfolio>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Portfolio);
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
});
