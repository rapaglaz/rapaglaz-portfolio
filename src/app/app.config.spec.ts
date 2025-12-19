import { TestBed } from '@angular/core/testing';
import {
  TRANSLOCO_LOADER,
  TRANSLOCO_MISSING_HANDLER,
  Translation,
  TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AVAILABLE_LANGS, DEFAULT_LANG, StrictTranslocoMissingHandler } from '../utils/i18n';
import { initTranslocoDefaultLang, provideTranslocoWithDynamicLang } from './app.config';

class InlineLoader implements TranslocoLoader {
  readonly calls: string[] = [];

  getTranslation(lang: string): Observable<Translation> {
    this.calls.push(lang);
    return of({});
  }
}

describe('app i18n config', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'de-DE' });

    TestBed.configureTestingModule({
      providers: [
        provideTranslocoWithDynamicLang(),
        { provide: TRANSLOCO_LOADER, useClass: InlineLoader },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('registers shared language config and missing handler', () => {
    const transloco = TestBed.inject(TranslocoService);
    const handler = TestBed.inject(TRANSLOCO_MISSING_HANDLER);

    expect(transloco.getAvailableLangs()).toEqual([...AVAILABLE_LANGS]);
    expect(transloco.getDefaultLang()).toBe(DEFAULT_LANG);
    expect(handler).toBeInstanceOf(StrictTranslocoMissingHandler);
  });

  it('initializes active language based on browser settings', async () => {
    const transloco = TestBed.inject(TranslocoService);
    const loader = TestBed.inject(TRANSLOCO_LOADER) as InlineLoader;
    await TestBed.runInInjectionContext(initTranslocoDefaultLang);

    expect(transloco.getActiveLang()).toBe('de');
    expect(loader.calls).toContain('de');
  });
});
