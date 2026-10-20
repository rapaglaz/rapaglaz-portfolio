import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from './transloco-testing';

describe('provideTranslocoTesting', () => {
  it('serves the bundled dictionaries in the default language', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    const transloco = TestBed.inject(TranslocoService);

    await firstValueFrom(transloco.load('en'));

    expect(transloco.getActiveLang()).toBe('en');
    expect(transloco.translate('portfolio.about.title')).toBe('About Me');
  });

  it('switches to the German dictionary', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslocoTesting()] });
    const transloco = TestBed.inject(TranslocoService);

    await firstValueFrom(transloco.load('de'));
    transloco.setActiveLang('de');

    expect(transloco.translate('portfolio.about.title')).toBe('Über mich');
  });
});
