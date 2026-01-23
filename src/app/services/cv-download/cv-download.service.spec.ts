import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { ConfigService } from '../config/config.service';
import { TurnstileService } from '../turnstile/turnstile.service';
import { CvDownloadService, TURNSTILE_TOKEN } from './cv-download.service';

describe('CvDownloadService', () => {
  let service: CvDownloadService;
  let httpMock: HttpTestingController;
  let translocoService: TranslocoService;
  let turnstileService: TurnstileService;
  let configService: ConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        CvDownloadService,
        { provide: ConfigService, useValue: { getConfig: vi.fn() } },
        { provide: TurnstileService, useValue: { getToken$: vi.fn() } },
      ],
    }).compileComponents();

    service = TestBed.inject(CvDownloadService);
    httpMock = TestBed.inject(HttpTestingController);
    translocoService = TestBed.inject(TranslocoService);
    turnstileService = TestBed.inject(TurnstileService);
    configService = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests language-specific CV and attaches Turnstile token to context', async () => {
    translocoService.setActiveLang('de');
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.downloadCV());

    const req = httpMock.expectOne(
      `./download?file=${encodeURIComponent('cv/Paul_Glaz_CV_DE.pdf')}`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(TURNSTILE_TOKEN)).toBe('token-123');

    req.flush(new Blob(['test'], { type: 'application/pdf' }));
    await downloadPromise;
  });

  it('propagates Turnstile failures and skips download request', async () => {
    translocoService.setActiveLang('en');
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(
      throwError(() => new Error('Turnstile failed')),
    );

    const downloadPromise = firstValueFrom(service.downloadCV());

    httpMock.expectNone(req => /\.?\/download\?file=/.test(req.urlWithParams));
    await expect(downloadPromise).rejects.toThrow('Turnstile failed');
  });

  it('propagates backend download errors', async () => {
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.downloadCV());

    const req = httpMock.expectOne(
      `./download?file=${encodeURIComponent('cv/Paul_Glaz_CV_EN.pdf')}`,
    );
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

    await expect(downloadPromise).rejects.toThrow();
  });
});
