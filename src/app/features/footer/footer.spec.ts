import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows current year and external links', () => {
    const footer = element.querySelector('footer');
    const year = new Date().getFullYear().toString();
    const externalLinks = Array.from(
      element.querySelectorAll('footer a[target="_blank"]'),
    ) as HTMLAnchorElement[];

    expect(footer).toBeInstanceOf(HTMLElement);
    expect(footer?.textContent).toContain(year);
    expect(externalLinks.length).toBeGreaterThanOrEqual(2);
    externalLinks.forEach(link => {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('href')?.trim()).toBeTruthy();
    });
  });

  it.each([
    ['en', 'Email', 'opens in new tab'],
    ['de', 'E-Mail', 'öffnet in neuem Tab'],
  ])('provides translated action labels and new-tab cues in %s', async (lang, email, newTab) => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load(lang));
    transloco.setActiveLang(lang);
    await fixture.whenStable();

    expect(element.querySelector('button')?.getAttribute('aria-label')).toBe(email);
    expect(element.querySelector('a[href*="linkedin"]')?.getAttribute('aria-label')).toBe(
      `LinkedIn (${newTab})`,
    );
    expect(element.querySelector('a[href*="github"]')?.getAttribute('aria-label')).toBe(
      `GitHub (${newTab})`,
    );
  });

  it('delegates contactEmail to window.location', () => {
    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { assign: assignSpy },
      writable: true,
      configurable: true,
    });

    const emailButton = element.querySelector(
      'footer button[type="button"]',
    ) as HTMLButtonElement | null;

    expect(emailButton).toBeInstanceOf(HTMLButtonElement);
    emailButton?.click();

    expect(assignSpy).toHaveBeenCalledTimes(1);
    expect(assignSpy.mock.calls[0][0]).toMatch(/^mailto:/);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
