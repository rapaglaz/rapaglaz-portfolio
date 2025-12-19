import { EnvironmentProviders } from '@angular/core';
import { provideTransloco, Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import deTranslations from '../../public/i18n/de.json';
import enTranslations from '../../public/i18n/en.json';
import { AVAILABLE_LANGS, DEFAULT_LANG, isAvailableLang, type AvailableLang } from '../utils/i18n/languages';

// loads translations synchronously from imports, no HTTP needed in tests
export class TranslocoTestLoader implements TranslocoLoader {
  private readonly translationCache = new Map<string, Translation>();

  getTranslation(lang: string): Observable<Translation> {
    const cached = this.translationCache.get(lang);
    if (cached) {
      return of(cached);
    }

    const translations: Record<AvailableLang, Translation> = {
      en: enTranslations as Translation,
      de: deTranslations as Translation,
    };

    const langKey = isAvailableLang(lang) ? lang : DEFAULT_LANG;
    const translation = translations[langKey];
    this.translationCache.set(lang, translation);
    return of(translation);
  }
}

export function provideTranslocoTesting(): EnvironmentProviders[] {
  return provideTransloco({
    config: {
      availableLangs: [...AVAILABLE_LANGS],
      defaultLang: DEFAULT_LANG,
      reRenderOnLangChange: true,
      prodMode: false,
      missingHandler: {
        logMissingKey: true,
        useFallbackTranslation: false,
      },
    },
    loader: TranslocoTestLoader,
  });
}
