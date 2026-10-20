import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api-urls.token';
import { TurnstileConfigService } from '../turnstile/turnstile-config.service';
import { TURNSTILE_TOKEN } from '../turnstile/turnstile-context';
import { TurnstileService } from '../turnstile/turnstile.service';

// The cv-download Worker serves only files under this prefix of its R2 bucket
const FILE_PREFIX = 'cv/';

export function triggerBrowserDownload(document: Document, blob: Blob, filename: string): void {
  const win = document.defaultView;
  if (!win || !document.body) return;

  const downloadUrl = win.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    win.URL.revokeObjectURL(downloadUrl);
  }
}

// Downloads a file that the Worker hands out only with a valid Turnstile token
@Injectable({ providedIn: 'root' })
export class ProtectedDownloadService {
  private readonly http = inject(HttpClient);
  private readonly turnstileService = inject(TurnstileService);
  private readonly turnstileConfig = inject(TurnstileConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly downloadEndpoint = `${inject(API_BASE_URL)}/download`;

  download(fileName: string, restoreFocus?: HTMLElement): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Downloads are only available in the browser'));
    }

    return this.turnstileConfig.getConfig().pipe(
      switchMap(config => this.turnstileService.getToken$(config.turnstileSiteKey, restoreFocus)),
      switchMap(token => this.downloadFile(fileName, token)),
    );
  }

  private downloadFile(fileName: string, token: string): Observable<void> {
    const url = `${this.downloadEndpoint}?file=${encodeURIComponent(FILE_PREFIX + fileName)}`;
    const context = new HttpContext().set(TURNSTILE_TOKEN, token);

    return this.http
      .get(url, { responseType: 'blob', context })
      .pipe(map(blob => triggerBrowserDownload(this.document, blob, fileName)));
  }
}
