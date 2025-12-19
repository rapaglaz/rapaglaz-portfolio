import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import deJson from '../../../public/i18n/de.json';
import enJson from '../../../public/i18n/en.json';
import { TranslocoFsLoader } from './transloco-fs-loader';

describe('TranslocoFsLoader', () => {
  let loader: TranslocoFsLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslocoFsLoader],
    });

    loader = TestBed.inject(TranslocoFsLoader);
  });

  it('loads en translation from filesystem', async () => {
    const translation = await firstValueFrom(loader.getTranslation('en'));
    expect(translation).toEqual(enJson);
  });

  it('loads de translation from filesystem', async () => {
    const translation = await firstValueFrom(loader.getTranslation('de'));
    expect(translation).toEqual(deJson);
  });

  it('falls back to en translation for unknown languages', async () => {
    const translation = await firstValueFrom(loader.getTranslation('es'));
    expect(translation).toEqual(enJson);
  });
});
