import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { provideTranslocoTesting, TranslocoTestLoader } from './transloco-test-loader';

describe('TranslocoTestLoader', () => {
  it.each([
    ['en', 'About Me'],
    ['de', 'Über mich'],
    ['fr', 'About Me'],
  ])('emits the expected translation for %s', async (lang, title) => {
    const loader = new TranslocoTestLoader();

    const translation = await firstValueFrom(loader.getTranslation(lang));

    expect(translation['portfolio'].about.title).toBe(title);
  });

  it('preserves translations when revisiting a language', async () => {
    const loader = new TranslocoTestLoader();
    const first = await firstValueFrom(loader.getTranslation('en'));

    await firstValueFrom(loader.getTranslation('de'));
    const revisited = await firstValueFrom(loader.getTranslation('en'));

    expect(revisited).toBe(first);
    expect(revisited['portfolio'].about.title).toBe('About Me');
  });
});

describe('provideTranslocoTesting', () => {
  it('serves the bundled dictionaries in the default language', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    const transloco = TestBed.inject(TranslocoService);

    await firstValueFrom(transloco.load('en'));

    expect(transloco.getActiveLang()).toBe('en');
    expect(transloco.translate('portfolio.about.title')).toBe('About Me');
  });
});
