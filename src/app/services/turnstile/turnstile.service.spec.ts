import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { LoggerService } from '../logger/logger.service';
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

  it('loads the script once and reuses the API for subsequent tokens', async () => {
    const firstToken = firstValueFrom(service.getToken$('first-site-key'));
    const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]')!;
    expect(script.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js');
    expect(script.async).toBe(true);
    expect(script.defer).toBe(true);
    const render = vi.fn((_container: HTMLElement, options: Record<string, any>) => {
      options['callback'](`token-for-${options['sitekey']}`);
      return 'loaded-widget';
    });
    (window as any).turnstile = { render, remove: vi.fn() };

    script.dispatchEvent(new Event('load'));

    await expect(firstToken).resolves.toBe('token-for-first-site-key');
    await expect(firstValueFrom(service.getToken$('second-site-key'))).resolves.toBe(
      'token-for-second-site-key',
    );
    expect(document.querySelectorAll('script[src*="turnstile"]')).toHaveLength(1);
    expect(document.querySelector('script[src*="turnstile"]')).toBe(script);
  });

  it('reports a missing API after retries and can load successfully on a later call', async () => {
    const failedToken = firstValueFrom(service.getToken$('site-key'));
    const rejection = expect(failedToken).rejects.toThrow('Turnstile API not available');
    const scripts: HTMLScriptElement[] = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]')!;
      scripts.push(script);
      script.dispatchEvent(new Event('load'));
    }

    await rejection;
    expect(new Set(scripts).size).toBe(3);
    expect(scripts[0].isConnected).toBe(false);
    expect(scripts[1].isConnected).toBe(false);

    const recoveredToken = firstValueFrom(service.getToken$('site-key'));
    const recoveredScript = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]')!;
    (window as any).turnstile = {
      render: (_container: HTMLElement, options: Record<string, any>): string => {
        options['callback']('recovered-token');
        return 'recovered-widget';
      },
      remove: vi.fn(),
    };
    recoveredScript.dispatchEvent(new Event('load'));

    await expect(recoveredToken).resolves.toBe('recovered-token');
    expect(scripts[2].isConnected).toBe(false);
  });

  it('moves an interactive widget into one modal and restores focus on completion', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const render = vi.fn(
      (_container: HTMLElement, _options: Record<string, any>) => 'interactive-widget',
    );
    const remove = vi.fn();
    (window as any).turnstile = { render, remove };
    const tokens: string[] = [];
    const subscription = service.getToken$('site-key').subscribe(token => tokens.push(token));
    const [widget, options] = render.mock.calls[0];

    try {
      expect(widget.parentElement).toBe(document.body);
      expect(widget.style.visibility).toBe('hidden');

      options['before-interactive-callback']();
      options['before-interactive-callback']();
      TestBed.tick();

      const dialog = document.querySelector('[role="dialog"]');
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
      expect(dialog?.querySelector('#turnstile-widget-container')?.contains(widget)).toBe(true);
      expect(widget.style.visibility).toBe('');
      expect(widget.style.left).toBe('');
      expect(widget.style.position).toBe('');
      expect(dialog?.querySelector('[role="status"]')).toBeNull();
      expect(document.activeElement).toBe(dialog);

      options['callback']('interactive-token');

      expect(tokens).toEqual(['interactive-token']);
      expect(subscription.closed).toBe(true);
      expect(remove).toHaveBeenCalledExactlyOnceWith('interactive-widget');
      expect(widget.isConnected).toBe(false);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      subscription.unsubscribe();
      trigger.remove();
    }
  });

  it('cleans up on cancellation even when the API fails to remove the widget', () => {
    const cleanupError = new Error('Removal failed');
    const warn = vi
      .spyOn(TestBed.inject(LoggerService), 'warn')
      .mockImplementation(() => undefined);
    const render = vi.fn((_container: HTMLElement) => 'cancelled-widget');
    const remove = vi.fn(() => {
      throw cleanupError;
    });
    (window as any).turnstile = { render, remove };
    const token = vi.fn();
    const subscription = service.getToken$('site-key').subscribe(token);
    const widget = render.mock.calls[0][0];

    subscription.unsubscribe();

    expect(token).not.toHaveBeenCalled();
    expect(widget.isConnected).toBe(false);
    expect(remove).toHaveBeenCalledExactlyOnceWith('cancelled-widget');
    expect(warn).toHaveBeenCalledExactlyOnceWith('Failed to remove Turnstile widget', cleanupError);
  });

  it('reports render failures and removes the hidden container', async () => {
    let widget: HTMLElement | undefined;
    (window as any).turnstile = {
      render: (container: HTMLElement): never => {
        widget = container;
        throw new Error('Invalid site key');
      },
      remove: vi.fn(),
    };

    await expect(firstValueFrom(service.getToken$('invalid-key'))).rejects.toThrow(
      'Failed to render widget: Error: Invalid site key',
    );

    expect(widget).toBeInstanceOf(HTMLElement);
    expect(widget?.isConnected).toBe(false);
  });
});

describe('TurnstileService platform guards', () => {
  it('rejects verification during server rendering', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    await expect(
      firstValueFrom(TestBed.inject(TurnstileService).getToken$('site-key')),
    ).rejects.toThrow('Turnstile is only available in the browser');

    expect(document.querySelector('script[src*="turnstile"]')).toBeNull();
  });

  it('rejects verification when the document has no window', async () => {
    const serverDocument = document.implementation.createHTMLDocument();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: serverDocument }],
    });

    await expect(
      firstValueFrom(TestBed.inject(TurnstileService).getToken$('site-key')),
    ).rejects.toThrow('Window not available');

    expect(serverDocument.querySelector('script')).toBeNull();
  });
});
