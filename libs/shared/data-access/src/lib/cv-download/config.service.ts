import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { API_BASE_URL } from '@rapaglaz/shared/util';
import { catchError, map, Observable, of, retry, shareReplay, throwError, timer } from 'rxjs';
import * as v from 'valibot';

const ConfigSchema = v.object({
  turnstileSiteKey: v.pipe(v.string(), v.minLength(1, 'Turnstile site key cannot be empty')),
});

type Config = v.InferOutput<typeof ConfigSchema>;

// Network failures (status 0) and server errors may pass; a 4xx or an invalid body will not
function isTransientHttpError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

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
  // up to 3 retries after the initial attempt, 250 ms, 500 ms and 1 s apart
  private static readonly MAX_CONFIG_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 250;

  getConfig(): Observable<Config> {
    this.config$ ??= this.fetchConfig().pipe(
      catchError((err: unknown) => {
        // shareReplay would replay the error forever; drop the cached
        // observable so the next getConfig() call fetches again
        this.config$ = null;
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
      retry({
        count: ConfigService.MAX_CONFIG_RETRIES,
        delay: (error: unknown, retryCount: number) =>
          isTransientHttpError(error)
            ? timer(ConfigService.RETRY_BASE_DELAY_MS * 2 ** (retryCount - 1))
            : throwError(() => error),
      }),
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
