import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { CONTACT_ITEMS } from '@rapaglaz/portfolio/util';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { Contact } from './contact';

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Contact], providers: [provideTranslocoTesting()] });
    fixture = TestBed.createComponent(Contact);
    fixture.componentRef.setInput('items', CONTACT_ITEMS);
    fixture.detectChanges();
  });

  it('renders email and external links with the appropriate navigation and accessibility attributes', () => {
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
      '[data-testid="contact-link"]',
    );

    expect(links).toHaveLength(3);
    expect(Array.from(links, link => link.tabIndex)).toEqual([0, 0, 0]);
    expect(links[0].getAttribute('href')).toBe('mailto:radek@rapaglaz.de');
    expect(links[0].getAttribute('target')).toBeNull();
    expect(links[0].getAttribute('rel')).toBeNull();
    expect(links[0].getAttribute('aria-label')).toBe('Email: radek@rapaglaz.de');
    expect(links[1].href).toBe('https://www.linkedin.com/in/radek-glaz/');
    expect(links[2].href).toBe('https://github.com/rapaglaz');
    for (const link of Array.from(links).slice(1)) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.getAttribute('aria-label')).toContain('(opens in new tab)');
    }
    expect(Array.from(links, link => link.style.animationDelay)).toEqual([
      '0.15s',
      '0.22s',
      '0.3s',
    ]);
  });

  it('translates the external-link accessibility cue after switching language', async () => {
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('de'));

    transloco.setActiveLang('de');
    fixture.detectChanges();

    const linkedIn = (fixture.nativeElement as HTMLElement).querySelector('a[href*="linkedin"]');
    expect(linkedIn?.getAttribute('aria-label')).toBe(
      'LinkedIn: linkedin.com/in/radek-glaz (öffnet in neuem Tab)',
    );
  });
});
