import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { DEFAULT_LANG, isAvailableLang, type AvailableLang } from '../languages/languages';
import deTranslations from '../translations/de.json';
import enTranslations from '../translations/en.json';

// Server only: the dictionaries are bundled into the server build, the browser loads them over HTTP
const TRANSLATIONS: Record<AvailableLang, Translation> = {
  en: enTranslations,
  de: deTranslations,
};

@Injectable({ providedIn: 'root' })
export class TranslocoFsLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(TRANSLATIONS[isAvailableLang(lang) ? lang : DEFAULT_LANG]);
  }
}
