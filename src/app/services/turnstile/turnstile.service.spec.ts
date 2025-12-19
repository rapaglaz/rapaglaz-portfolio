import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService (integration)', () => {
  let service: TurnstileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TurnstileService, provideTranslocoTesting()],
    });

    service = TestBed.inject(TurnstileService);
  });

  afterEach(() => {
    delete (window as any).turnstile;
    document.querySelectorAll('script[src*="turnstile"]').forEach(script => script.remove());
    vi.restoreAllMocks();
  });

  it('resolves token when Turnstile API is available', async () => {
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['callback']?.('token-123');
      return 'widget-1';
    });
    (window as any).turnstile = { render: renderSpy, remove: vi.fn() };

    const token = await firstValueFrom(service.getToken$('site-key'));

    expect(token).toBe('token-123');
    expect(renderSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'site-key' }),
    );
  });

  it('fails when Turnstile script cannot be loaded', async () => {
    let scriptEl: HTMLScriptElement | null = null;
    const appendSpy = vi.spyOn(document.head!, 'appendChild').mockImplementation(el => {
      scriptEl = el as HTMLScriptElement;
      return el;
    });

    const tokenPromise = firstValueFrom(service.getToken$('site-key'));

    expect(scriptEl).not.toBeNull();
    if (!scriptEl) {
      throw new Error('Turnstile script element was not appended');
    }
    const script = scriptEl as {
      src: string;
      async: boolean;
      defer: boolean;
      onerror?: (event: Event) => void;
    };
    expect(script.src).toContain('challenges.cloudflare.com/turnstile/v0/api.js');
    expect(script.async).toBe(true);
    expect(script.defer).toBe(true);
    script.onerror?.(new Event('error'));

    await expect(tokenPromise).rejects.toThrow('Failed to load Turnstile script');

    appendSpy.mockRestore();
  });

  it('propagates Turnstile verification errors and cleans up widget', async () => {
    const removeSpy = vi.fn();
    const renderSpy = vi.fn((_container: HTMLElement, options?: Record<string, any>) => {
      options?.['error-callback']?.();
      return 'widget-err';
    });
    (window as any).turnstile = { render: renderSpy, remove: removeSpy };

    await expect(firstValueFrom(service.getToken$('site-key'))).rejects.toThrow(
      'Turnstile verification failed',
    );

    expect(renderSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('widget-err');
  });
});
