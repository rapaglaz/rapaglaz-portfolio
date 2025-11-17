import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslocoTestLoader } from '../../testing';
import { TurnstileService } from './turnstile.service';

function mockTurnstileApi(overrides: Partial<TurnstileAPI> = {}): TurnstileAPI {
  const api: TurnstileAPI = {
    render: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
  (window as any).turnstile = api;
  return api;
}

type TurnstileAPI = {
  render: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

describe('TurnstileService (integration)', () => {
  let service: TurnstileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TurnstileService,
        provideZonelessChangeDetection(),
        provideTransloco({
          config: { availableLangs: ['en', 'de'], defaultLang: 'en' },
          loader: TranslocoTestLoader,
        }),
      ],
    });

    service = TestBed.inject(TurnstileService);
  });

  afterEach(() => {
    delete (window as any).turnstile;
    document.querySelectorAll('script[src*="turnstile"]').forEach(script => script.remove());
    vi.restoreAllMocks();
  });

  it('resolves token when API loaded', async () => {
    const modalDetachSpy = vi.spyOn(document.body, 'removeChild');
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['callback']?.('token-123');
      return 'widget-1';
    });
    mockTurnstileApi({ render: renderSpy, remove: vi.fn() });

    const token = await firstValueFrom(service.getToken$('site-key'));

    expect(token).toBe('token-123');
    expect(renderSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'site-key' }),
    );
    expect(modalDetachSpy).toHaveBeenCalled();
  });

  it('injects script and resolves token', async () => {
    delete (window as any).turnstile;
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['callback']?.('token-loaded');
      return 'widget-loaded';
    });
    const headAppendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(node => {
      const element = node as HTMLScriptElement;
      if (element.tagName === 'SCRIPT' && element.src.includes('turnstile')) {
        setTimeout(() => {
          (window as any).turnstile = { render: renderSpy, remove: vi.fn() };
          element.onload?.(new Event('load'));
        }, 0);
      }
      return element;
    });

    const token = await firstValueFrom(service.getToken$('site-key'));

    expect(token).toBe('token-loaded');
    expect(headAppendSpy).toHaveBeenCalledWith(expect.objectContaining({ tagName: 'SCRIPT' }));
    expect(renderSpy).toHaveBeenCalled();
  });

  it('propagates verification failures', async () => {
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['error-callback']?.();
      return 'widget-error';
    });
    mockTurnstileApi({ render: renderSpy, remove: vi.fn() });

    await expect(firstValueFrom(service.getToken$('site-key'))).rejects.toThrow(
      'Turnstile verification failed',
    );
  });

  it('allows retry after script load failure', async () => {
    delete (window as any).turnstile;
    let scriptLoadAttempts = 0;
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['callback']?.('token-retry');
      return 'widget-retry';
    });

    const headAppendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(node => {
      const element = node as HTMLScriptElement;
      if (element.tagName === 'SCRIPT' && element.src.includes('turnstile')) {
        scriptLoadAttempts++;
        setTimeout(() => {
          if (scriptLoadAttempts === 1) {
            element.onerror?.(new Event('error'));
          } else {
            (window as any).turnstile = { render: renderSpy, remove: vi.fn() };
            element.onload?.(new Event('load'));
          }
        }, 0);
      }
      return element;
    });

    await expect(firstValueFrom(service.getToken$('site-key'))).rejects.toThrow(
      'Failed to load Turnstile script',
    );

    expect(scriptLoadAttempts).toBe(1);

    const token = await firstValueFrom(service.getToken$('site-key'));

    expect(token).toBe('token-retry');
    expect(scriptLoadAttempts).toBe(2);
    expect(headAppendSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenCalledOnce();
  });
});
