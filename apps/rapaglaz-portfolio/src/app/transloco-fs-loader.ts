import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { DEFAULT_LANG, isAvailableLang, type AvailableLang } from '@rapaglaz/shared/util';
import deTranslations from '@rapaglaz/shared/util/i18n/de.json';
import enTranslations from '@rapaglaz/shared/util/i18n/en.json';
import { Observable, of } from 'rxjs';

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
