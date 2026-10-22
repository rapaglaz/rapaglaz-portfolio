import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { map, Observable } from 'rxjs';
import * as v from 'valibot';

// v.record accepts an array, so the check is written out
const TranslationSchema = v.custom<Record<string, unknown>>(
  value => typeof value === 'object' && value !== null && !Array.isArray(value),
  'A translation file must be an object',
);

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    return this.http
      .get<unknown>(`./i18n/${lang}.json`)
      .pipe(map(body => v.parse(TranslationSchema, body)));
  }
}
