import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { ConfigService } from '../config/config.service';
import { TurnstileService } from '../turnstile/turnstile.service';
import { CvDownloadService, triggerBrowserDownload } from './cv-download.service';

type MockDocument = {
  defaultView: {
    URL: {
      createObjectURL: ReturnType<typeof vi.fn>;
      revokeObjectURL: ReturnType<typeof vi.fn>;
    };
  };
  createElement: ReturnType<typeof vi.fn>;
  body: {
    appendChild: ReturnType<typeof vi.fn>;
    removeChild: ReturnType<typeof vi.fn>;
  };
};

describe('CvDownloadService', () => {
  let service: CvDownloadService;
  let httpMock: HttpTestingController;
  let translocoService: TranslocoService;
  let turnstileService: TurnstileService;
  let configService: ConfigService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
        ConfigService,
        CvDownloadService,
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

  function mockBrowserDownloadEnvironment(): () => void {
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => node);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(node => node);

    const mockAnchor: Pick<HTMLAnchorElement, 'href' | 'download' | 'click'> = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockAnchor as HTMLAnchorElement);

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url') as typeof global.URL.createObjectURL;
    global.URL.revokeObjectURL = vi.fn() as typeof global.URL.revokeObjectURL;

    return () => {
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      createElementSpy.mockRestore();
    };
  }

  async function expectDownloadForLanguage(lang: string, expectedFilename: string): Promise<void> {
    translocoService.setActiveLang(lang);
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(of('token'));
    const restoreBrowserMocks = mockBrowserDownloadEnvironment();
    const downloadPromise = firstValueFrom(service.downloadCV());
    const req = httpMock.expectOne(
      `/download?file=${encodeURIComponent(`cv/${expectedFilename}`)}`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain(encodeURIComponent(expectedFilename));
    req.flush(new Blob(['test'], { type: 'application/pdf' }));

    await downloadPromise;
    restoreBrowserMocks();
  }

  it('requests German CV for "de" language', async () => {
    await expectDownloadForLanguage('de', 'Paul_Glaz_CV_DE.pdf');
  });

  it('requests English CV for "en" language', async () => {
    await expectDownloadForLanguage('en', 'Paul_Glaz_CV_EN.pdf');
  });

  it('throws error on config failure', async () => {
    const error = new Error('Config fetch failed');
    vi.spyOn(configService, 'getConfig').mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(service.downloadCV())).rejects.toThrow('Config fetch failed');
  });

  it('throws error on verification failure', async () => {
    const error = new Error('Turnstile verification failed');
    vi.spyOn(configService, 'getConfig').mockReturnValue(of({ turnstileSiteKey: 'test-key' }));
    vi.spyOn(turnstileService, 'getToken$').mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(service.downloadCV())).rejects.toThrow(
      'Turnstile verification failed',
    );
  });

  it('triggers download on successful request', () => {
    const mockAnchor: Partial<HTMLAnchorElement> = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    const mockDocument: MockDocument = {
      defaultView: {
        URL: {
          createObjectURL: vi.fn(() => 'blob:mock-url'),
          revokeObjectURL: vi.fn(),
        },
      },
      createElement: vi.fn(() => mockAnchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    const blob = new Blob(['test'], { type: 'application/pdf' });
    const filename = 'test.pdf';

    triggerBrowserDownload(mockDocument as unknown as Document, blob, filename);

    expect(mockDocument.defaultView?.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(mockDocument.createElement).toHaveBeenCalledWith('a');
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
    expect(mockDocument.body.removeChild).toHaveBeenCalled();
    expect(mockDocument.defaultView?.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
