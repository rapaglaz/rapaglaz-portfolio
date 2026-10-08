import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from './app.routes';
import { Portfolio } from './portfolio/portfolio';
import { provideTranslocoTesting } from './testing';

describe('portfolio routes', () => {
  let originalDocumentLang: string;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
      ],
    });
    originalDocumentLang = TestBed.inject(DOCUMENT).documentElement.lang;
    TestBed.inject(DOCUMENT).documentElement.lang = '';
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).documentElement.lang = originalDocumentLang;
    vi.restoreAllMocks();
  });

  it.each([
    ['/', 'en', 'About Me'],
    ['/en', 'en', 'About Me'],
    ['/de', 'de', 'Über Mich'],
  ])('synchronizes content and document language at %s', async (path, lang, heading) => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(path, Portfolio);

    expect(TestBed.inject(Router).url).toBe(path);
    expect(harness.routeNativeElement?.querySelector('main')).toBeInstanceOf(HTMLElement);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Radoslaw');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe(lang);
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe(lang);
    expect(harness.routeNativeElement?.querySelector('app-about h2')?.textContent).toContain(
      heading,
    );
    expect(
      TestBed.inject(DOCUMENT).head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe(`https://rapaglaz.de/${lang}`);
  });

  it('returns to English when navigating from German to the root fallback', async () => {
    const harness = await RouterTestingHarness.create('/de');

    await harness.navigateByUrl('/', Portfolio);

    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
    expect(harness.routeNativeElement?.querySelector('app-about h2')?.textContent).toContain(
      'About Me',
    );
  });

  it('redirects an unavailable German translation to English and preserves URL extras', async () => {
    const harness = await RouterTestingHarness.create('/en');
    const transloco = TestBed.inject(TranslocoService);
    const load = transloco.load.bind(transloco);
    vi.spyOn(transloco, 'load').mockImplementation(lang =>
      lang === 'de' ? throwError(() => new Error('Translation unavailable')) : load(lang),
    );

    await harness.navigateByUrl('/de?source=navbar#skills', Portfolio);

    expect(TestBed.inject(Router).url).toBe('/en?source=navbar#skills');
    expect(transloco.getActiveLang()).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
    expect(harness.routeNativeElement?.querySelector('app-about h2')?.textContent).toContain(
      'About Me',
    );
  });

  it('keeps the current route and language if English cannot be loaded', async () => {
    const harness = await RouterTestingHarness.create('/de');
    const transloco = TestBed.inject(TranslocoService);
    const load = transloco.load.bind(transloco);
    vi.spyOn(transloco, 'load').mockImplementation(lang =>
      lang === 'en' ? throwError(() => new Error('Translation unavailable')) : load(lang),
    );

    await harness.navigateByUrl('/en');

    expect(TestBed.inject(Router).url).toBe('/de');
    expect(transloco.getActiveLang()).toBe('de');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('de');
  });

  it('redirects an unknown path to the root portfolio', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown/page', Portfolio);

    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('main')).toBeInstanceOf(HTMLElement);
  });
});
