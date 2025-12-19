import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { getBrowserLanguage } from '../../utils/i18n';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { TurnstileService } from '../turnstile/turnstile.service';

export const TURNSTILE_TOKEN = new HttpContextToken<string | null>(() => null);

export function triggerBrowserDownload(document: Document, blob: Blob, filename: string): void {
  const win = document.defaultView;
  if (!win || !document.body) return;

  const downloadUrl = win.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  win.URL.revokeObjectURL(downloadUrl);
}

@Injectable({ providedIn: 'root' })
export class CvDownloadService {
  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);
  private readonly turnstileService = inject(TurnstileService);
  private readonly configService = inject(ConfigService);
  private readonly loggerService = inject(LoggerService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly downloadEndpoint = '/download';

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly cvFilename = computed(() => {
    const lang = this.detectLanguage();
    return `Paul_Glaz_CV_${lang}.pdf`;
  });

  downloadCV(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('CV download is only available in the browser'));
    }

    return this.configService.getConfig().pipe(
      switchMap(config => this.turnstileService.getToken$(config.turnstileSiteKey)),
      switchMap(token => this.downloadFile(token)),
    );
  }

  private downloadFile(token: string): Observable<void> {
    const filename = this.cvFilename();
    const filePath = `cv/${filename}`;
    const url = `${this.downloadEndpoint}?file=${encodeURIComponent(filePath)}`;

    const context = new HttpContext().set(TURNSTILE_TOKEN, token);

    return this.http
      .get(url, {
        responseType: 'blob',
        context,
      })
      .pipe(
        map(blob => {
          triggerBrowserDownload(this.document, blob, filename);
        }),
      );
  }

  private detectLanguage(): string {
    const activeLang = this.activeLang();
    if (activeLang) {
      return activeLang.toUpperCase();
    }
    const browserLang = getBrowserLanguage(this.loggerService);
    return (browserLang?.split('-')[0] ?? 'EN').toUpperCase();
  }
}
