import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';
import * as v from 'valibot';
import { API_BASE_URL } from '../../utils/tokens/api-urls.token';

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
  private readonly configUrl = `${inject(API_BASE_URL)}/config`;
  // Cloudflare test key, always passes in dev so no real key needed
  private readonly TEST_TURNSTILE_KEY = '1x00000000000000000000AA';

  private config$: Observable<Config> | null = null;
  private configFetchAttempts = 0;
  // 3 retries after the initial attempt = 4 total fetches before giving up
  private static readonly MAX_CONFIG_RETRIES = 3;

  getConfig(): Observable<Config> {
    this.config$ ??= this.fetchConfig().pipe(
      catchError(err => {
        // Reset before shareReplay so the counter tracks HTTP-level errors
        if (this.configFetchAttempts++ < ConfigService.MAX_CONFIG_RETRIES) {
          this.config$ = null;
        }
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.config$;
  }

  private fetchConfig(): Observable<Config> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ turnstileSiteKey: this.TEST_TURNSTILE_KEY });
    }

    if (this.isLocalDev()) {
      return of({ turnstileSiteKey: this.TEST_TURNSTILE_KEY });
    }

    return this.http.get<unknown>(this.configUrl).pipe(
      map((response: unknown) => {
        const result = v.safeParse(ConfigSchema, response);
        if (!result.success) {
          const issues = result.issues.map(i => i.message).join(', ');
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

  private isLocalDev(): boolean {
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
