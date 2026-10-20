import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../api/api-urls.token';
import { TurnstileConfigService } from '../turnstile/turnstile-config.service';
import { TURNSTILE_TOKEN } from '../turnstile/turnstile-context';
import { TurnstileService } from '../turnstile/turnstile.service';
import { ProtectedDownloadService, triggerBrowserDownload } from './protected-download.service';

describe('ProtectedDownloadService', () => {
  let service: ProtectedDownloadService;
  let httpMock: HttpTestingController;
  let turnstileService: TurnstileService;
  let turnstileConfig: TurnstileConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProtectedDownloadService,
        { provide: API_BASE_URL, useValue: '' },
        { provide: TurnstileConfigService, useValue: { getConfig: vi.fn() } },
        { provide: TurnstileService, useValue: { getToken$: vi.fn() } },
      ],
    }).compileComponents();

    service = TestBed.inject(ProtectedDownloadService);
    httpMock = TestBed.inject(HttpTestingController);
    turnstileService = TestBed.inject(TurnstileService);
    turnstileConfig = TestBed.inject(TurnstileConfigService);
    vi.spyOn(turnstileConfig, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('requests the file under the cv/ prefix with the Turnstile token in the context', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('CV-DE.pdf');
    });
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.download('CV-DE.pdf'));

    const req = httpMock.expectOne(`/download?file=${encodeURIComponent('cv/CV-DE.pdf')}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(TURNSTILE_TOKEN)).toBe('token-123');

    req.flush(new Blob(['test'], { type: 'application/pdf' }));
    await downloadPromise;
    expect(click).toHaveBeenCalledOnce();
  });

  it('propagates Turnstile failures and skips the download request', async () => {
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(
      throwError(() => new Error('Turnstile failed')),
    );

    const downloadPromise = firstValueFrom(service.download('CV-EN.pdf'));

    httpMock.expectNone(req => /\.?\/download\?file=/.test(req.urlWithParams));
    await expect(downloadPromise).rejects.toThrow('Turnstile failed');
  });

  it('passes the download trigger to verification and completes cancellation without HTTP', () => {
    const trigger = document.createElement('button');
    const getToken = vi.spyOn(turnstileService, 'getToken$').mockReturnValue(EMPTY);
    const next = vi.fn();
    const error = vi.fn();
    const complete = vi.fn();

    service.download('CV-EN.pdf', trigger).subscribe({ next, error, complete });

    expect(getToken).toHaveBeenCalledExactlyOnceWith('test-key', trigger);
    expect(next).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
    httpMock.expectNone(() => true);
  });

  it('propagates backend download errors', async () => {
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token-123'));

    const downloadPromise = firstValueFrom(service.download('CV-EN.pdf'));

    const req = httpMock.expectOne(`/download?file=${encodeURIComponent('cv/CV-EN.pdf')}`);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

    await expect(downloadPromise).rejects.toThrow();
  });
});

describe('ProtectedDownloadService (server)', () => {
  it('rejects downloads without requesting configuration or verification', async () => {
    const getConfig = vi.fn();
    const getToken$ = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: TurnstileConfigService, useValue: { getConfig } },
        { provide: TurnstileService, useValue: { getToken$ } },
      ],
    });

    await expect(
      firstValueFrom(TestBed.inject(ProtectedDownloadService).download('CV-EN.pdf')),
    ).rejects.toThrow('Downloads are only available in the browser');

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
