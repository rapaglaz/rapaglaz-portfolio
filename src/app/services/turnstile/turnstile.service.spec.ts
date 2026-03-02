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

  it('fails and retries when Turnstile script cannot be loaded', async () => {
    const appendSpy = vi.spyOn(document.head!, 'appendChild').mockImplementation(el => {
      // Fire onerror as a microtask so it processes during `await` in Zone.js.
      // retry({ count: 2 }) is synchronous (no delay scheduler), so each retry
      // subscribes immediately and the next microtask is queued before `await` resumes.
      void Promise.resolve().then(() => (el as HTMLScriptElement).onerror?.(new Event('error')));
      return el;
    });

    await expect(firstValueFrom(service.getToken$('site-key'))).rejects.toThrow(
      'Failed to load Turnstile script',
    );

    expect(appendSpy).toHaveBeenCalledTimes(3); // initial + 2 retries
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
