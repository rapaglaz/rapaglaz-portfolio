import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, defer, map, Observable, of, shareReplay, throwError } from 'rxjs';
import * as v from 'valibot';

const ConfigSchema = v.object({
  turnstileSiteKey: v.pipe(v.string(), v.minLength(1, 'Turnstile site key cannot be empty')),
});

type Config = v.InferOutput<typeof ConfigSchema>;

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly configUrl = '/config';
  // Cloudflare test key, always passes in dev so no real key needed
  private readonly TEST_TURNSTILE_KEY = '1x00000000000000000000AA';

  // cache config; reset on error so a transient failure doesn't stick
  private config$: Observable<Config> | null = null;

  getConfig(): Observable<Config> {
    this.config$ ??= defer(() => this.fetchConfig()).pipe(
      shareReplay(1),
      catchError(err => {
        this.config$ = null;
        return throwError(() => err);
      }),
    );
    return this.config$;
  }

  private fetchConfig(): Observable<Config> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ turnstileSiteKey: this.TEST_TURNSTILE_KEY });
    }

    if (this.isLocalhost()) {
      return of({ turnstileSiteKey: this.TEST_TURNSTILE_KEY });
    }

    return this.http.get<unknown>(this.configUrl).pipe(
      map((response: unknown) => {
        const result = v.safeParse(ConfigSchema, response);
        if (!result.success) {
          const issues = result.issues.map((i: v.BaseIssue<unknown>) => i.message).join(', ');
          throw new Error(`Invalid config response: ${issues}`);
        }
        return result.output;
      }),
      catchError((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown config fetch error';
        return throwError(() => new Error(`Failed to fetch config: ${message}`));
      }),
    );
  }

  private isLocalhost(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const win = this.document.defaultView;
    if (!win) {
      return false;
    }

    const hostname = win.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }
}
