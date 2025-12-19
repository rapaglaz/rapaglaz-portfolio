import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { from, map, Observable } from 'rxjs';
import { DEFAULT_LANG, type AvailableLang, isAvailableLang } from './languages';

type TranslationModule = { default: Translation } | Translation;

const TRANSLATIONS: Record<AvailableLang, () => Promise<TranslationModule>> = {
  en: () => import('../../../public/i18n/en.json'),
  de: () => import('../../../public/i18n/de.json'),
};

@Injectable({ providedIn: 'root' })
export class TranslocoFsLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    const langKey = isAvailableLang(lang) ? lang : DEFAULT_LANG;
    const loader = TRANSLATIONS[langKey];

    return from(loader()).pipe(
      map(module => ('default' in module ? module.default : module)),
    );
  }
}
