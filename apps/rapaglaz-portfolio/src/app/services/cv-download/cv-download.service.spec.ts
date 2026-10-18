import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { EMPTY, firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { API_BASE_URL } from '../../utils/tokens/api-urls.token';
import { ConfigService } from '../config/config.service';
import { TurnstileService } from '../turnstile/turnstile.service';
import { CvDownloadService, triggerBrowserDownload, TURNSTILE_TOKEN } from './cv-download.service';

describe('CvDownloadService', () => {
  let service: CvDownloadService;
  let httpMock: HttpTestingController;
  let translocoService: TranslocoService;
  let turnstileService: TurnstileService;
  let configService: ConfigService;

  beforeEach(async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        CvDownloadService,
        { provide: API_BASE_URL, useValue: '' },
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requests language-specific CV and attaches Turnstile token to context', async () => {
    translocoService.setActiveLang('de');
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.downloadCV());

    const req = httpMock.expectOne(
      `/download?file=${encodeURIComponent('cv/Radoslaw_Pawel_Glaz_CV-DE.pdf')}`,
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

  it('passes the download trigger to verification and completes cancellation without HTTP', () => {
    const trigger = document.createElement('button');
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    const getToken = vi.spyOn(turnstileService, 'getToken$').mockReturnValue(EMPTY);
    const next = vi.fn();
    const error = vi.fn();
    const complete = vi.fn();

    service.downloadCV(trigger).subscribe({ next, error, complete });

    expect(getToken).toHaveBeenCalledExactlyOnceWith('test-key', trigger);
    expect(next).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
    httpMock.expectNone(() => true);
  });

  it('propagates backend download errors', async () => {
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.downloadCV());

    const req = httpMock.expectOne(
      `/download?file=${encodeURIComponent('cv/Radoslaw_Pawel_Glaz_CV-EN.pdf')}`,
    );
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

    await expect(downloadPromise).rejects.toThrow();
  });

  it.each([
    ['de-DE', 'DE'],
    [123, 'EN'],
  ])('uses browser language %s when there is no active locale', async (language, code) => {
    translocoService.setActiveLang('');
    vi.stubGlobal('navigator', { language });
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const download = firstValueFrom(service.downloadCV());
    const request = httpMock.expectOne(
      `/download?file=${encodeURIComponent(`cv/Radoslaw_Pawel_Glaz_CV-${code}.pdf`)}`,
    );
    request.flush(new Blob(['CV'], { type: 'application/pdf' }));

    await expect(download).resolves.toBeUndefined();
  });
});

describe('CvDownloadService (server)', () => {
  it('rejects downloads without requesting configuration or verification', async () => {
    const getConfig = vi.fn();
    const getToken$ = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ConfigService, useValue: { getConfig } },
        { provide: TurnstileService, useValue: { getToken$ } },
      ],
    });

    await expect(firstValueFrom(TestBed.inject(CvDownloadService).downloadCV())).rejects.toThrow(
      'CV download is only available in the browser',
    );

    expect(getConfig).not.toHaveBeenCalled();
    expect(getToken$).not.toHaveBeenCalled();
    TestBed.inject(HttpTestingController).expectNone(() => true);
    TestBed.inject(HttpTestingController).verify();
  });
});

describe('triggerBrowserDownload', () => {
  afterEach(() => vi.restoreAllMocks());

  it('downloads the blob with the supplied filename and releases its URL', () => {
    const blob = new Blob(['CV'], { type: 'application/pdf' });
    const createUrl = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:cv-download');
    const revokeUrl = vi.spyOn(window.URL, 'revokeObjectURL');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe('CV-DE.pdf');
      expect(this.href).toBe('blob:cv-download');
    });

    triggerBrowserDownload(document, blob, 'CV-DE.pdf');

    expect(click).toHaveBeenCalledOnce();
    const clickedLink = click.mock.contexts[0] as HTMLAnchorElement;
    expect(createUrl).toHaveBeenCalledExactlyOnceWith(blob);
    expect(clickedLink).toBeInstanceOf(HTMLAnchorElement);
    expect(clickedLink.isConnected).toBe(false);
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:cv-download');
  });

  it('does not create a download for a document without a window', () => {
    const serverDocument = document.implementation.createHTMLDocument();
    const createUrl = vi.spyOn(window.URL, 'createObjectURL');

    triggerBrowserDownload(serverDocument, new Blob(['CV']), 'CV.pdf');

    expect(serverDocument.querySelector('a')).toBeNull();
    expect(createUrl).not.toHaveBeenCalled();
  });
});
