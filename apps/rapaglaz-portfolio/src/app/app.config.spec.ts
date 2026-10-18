import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  Translation,
  TRANSLOCO_LOADER,
  TRANSLOCO_MISSING_HANDLER,
  TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { firstValueFrom, Observable, of, throwError, toArray } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrap, initTranslocoDefaultLang, provideTranslocoWithDynamicLang } from './app.config';
import { AVAILABLE_LANGS, DEFAULT_LANG, StrictTranslocoMissingHandler } from './utils/i18n';

vi.mock('@angular/platform-browser', async importOriginal => ({
  ...(await importOriginal<typeof import('@angular/platform-browser')>()),
  bootstrapApplication: vi.fn(),
}));

class InlineLoader implements TranslocoLoader {
  readonly calls: string[] = [];

  getTranslation(lang: string): Observable<Translation> {
    this.calls.push(lang);
    return of({});
  }
}

describe('app i18n config', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslocoWithDynamicLang(),
        { provide: TRANSLOCO_LOADER, useClass: InlineLoader },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('registers shared language config and missing handler', () => {
    const transloco = TestBed.inject(TranslocoService);
    const handler = TestBed.inject(TRANSLOCO_MISSING_HANDLER);

    expect(transloco.getAvailableLangs()).toEqual([...AVAILABLE_LANGS]);
    expect(transloco.getDefaultLang()).toBe(DEFAULT_LANG);
    expect(handler).toBeInstanceOf(StrictTranslocoMissingHandler);
  });

  it('initializes active language with the default locale', async () => {
    const transloco = TestBed.inject(TranslocoService);
    const loader = TestBed.inject(TRANSLOCO_LOADER) as InlineLoader;
    const document = TestBed.inject(DOCUMENT);
    await TestBed.runInInjectionContext(initTranslocoDefaultLang);

    expect(transloco.getActiveLang()).toBe(DEFAULT_LANG);
    expect(loader.calls).toContain(DEFAULT_LANG);
    expect(document.documentElement.lang).toBe(DEFAULT_LANG);
  });

  it('uses the url segment when a supported locale is in the path', async () => {
    const mockDocument = {
      location: { pathname: '/de' },
      baseURI: 'http://localhost/de',
      documentElement: { lang: '' },
    } as unknown as Document;

    TestBed.overrideProvider(DOCUMENT, { useValue: mockDocument });

    const transloco = TestBed.inject(TranslocoService);
    const loader = TestBed.inject(TRANSLOCO_LOADER) as InlineLoader;
    await TestBed.runInInjectionContext(initTranslocoDefaultLang);

    expect(transloco.getActiveLang()).toBe('de');
    expect(loader.calls).toContain('de');
    expect(mockDocument.documentElement.lang).toBe('de');
  });

  it.each([
    [undefined, 'http://localhost/de', 'de'],
    ['', 'http://localhost/de/profile', 'de'],
    ['/fr', 'http://localhost/de', 'en'],
    ['', 'invalid-url', 'en'],
    ['', 'http://localhost/', 'en'],
  ])('resolves locale from pathname %s and base URI %s', async (pathname, baseURI, expected) => {
    const mockDocument = { location: { pathname }, baseURI, documentElement: { lang: '' } };
    TestBed.overrideProvider(DOCUMENT, { useValue: mockDocument });
    const transloco = TestBed.inject(TranslocoService);
    const loader = TestBed.inject(TRANSLOCO_LOADER) as InlineLoader;

    await firstValueFrom(TestBed.runInInjectionContext(initTranslocoDefaultLang));

    expect(transloco.getActiveLang()).toBe(expected);
    expect(loader.calls).toEqual([expected]);
    expect(mockDocument.documentElement.lang).toBe(expected);
  });

  it('falls back to English when the URL locale fails to load', async () => {
    const mockDocument = {
      location: { pathname: '/de' },
      documentElement: { lang: '' },
    };
    TestBed.overrideProvider(DOCUMENT, { useValue: mockDocument });
    const transloco = TestBed.inject(TranslocoService);
    const load = vi
      .spyOn(transloco, 'load')
      .mockReturnValueOnce(throwError(() => new Error('German unavailable')))
      .mockReturnValueOnce(of({ title: 'English content' }));

    const result = await firstValueFrom(TestBed.runInInjectionContext(initTranslocoDefaultLang));

    expect(result).toEqual({ title: 'English content' });
    expect(load.mock.calls).toEqual([['de'], ['en']]);
    expect(transloco.getActiveLang()).toBe('en');
    expect(mockDocument.documentElement.lang).toBe('en');
  });

  it('completes without retrying when the default locale fails to load', async () => {
    const transloco = TestBed.inject(TranslocoService);
    const load = vi
      .spyOn(transloco, 'load')
      .mockReturnValue(throwError(() => new Error('English unavailable')));

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(initTranslocoDefaultLang).pipe(toArray()),
    );

    expect(result).toEqual([]);
    expect(load).toHaveBeenCalledExactlyOnceWith('en');
    expect(transloco.getActiveLang()).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
  });
});

describe('bootstrap error localization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ['/', 'en', 'Failed to load the application. Please refresh the page.'],
    ['/en', 'en', 'Failed to load the application. Please refresh the page.'],
    ['/de', 'de', 'Die Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.'],
    [
      '/de/profile',
      'de',
      'Die Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.',
    ],
    ['/fr', 'en', 'Failed to load the application. Please refresh the page.'],
  ])('shows the %s failure in %s without Angular or Transloco', async (pathname, lang, message) => {
    const error = new Error('Internal bootstrap failure');
    const mockDocument = {
      location: { pathname },
      documentElement: document.createElement('html'),
      body: document.createElement('body'),
      createElement: document.createElement.bind(document),
    };
    vi.stubGlobal('document', mockDocument);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(bootstrapApplication).mockRejectedValueOnce(error);

    await expect(bootstrap()).rejects.toBe(error);

    expect(mockDocument.documentElement.lang).toBe(lang);
    expect(mockDocument.body.textContent).toBe(message);
    expect(mockDocument.body.querySelector('[role="alert"]')?.textContent).toBe(message);
  });
});
