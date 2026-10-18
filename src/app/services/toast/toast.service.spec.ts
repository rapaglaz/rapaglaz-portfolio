import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let overlayMock: { create: ReturnType<typeof vi.fn>; position: ReturnType<typeof vi.fn> };
  let createdRef: OverlayRef;

  beforeEach(() => {
    const positionCalls = {
      top: vi.fn().mockReturnThis(),
      left: vi.fn().mockReturnThis(),
      right: vi.fn().mockReturnThis(),
    };

    overlayMock = {
      create: vi.fn(),
      position: vi.fn(() => ({
        global: vi.fn(() => positionCalls),
      })),
    };

    createdRef = {
      overlayElement: document.createElement('div'),
      attach: vi.fn().mockReturnValue({
        setInput: vi.fn(),
        instance: {
          dismissed: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
        },
      }),
      dispose: vi.fn(),
    } as unknown as OverlayRef;

    overlayMock.create.mockReturnValue(createdRef);

    TestBed.configureTestingModule({
      providers: [ToastService, { provide: Overlay, useValue: overlayMock }],
    });

    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.dismiss();
    vi.restoreAllMocks();
  });

  it('creates overlay when showing toast', async () => {
    await service.show('Saved!', 'success');

    expect(overlayMock.create).toHaveBeenCalledTimes(1);
    expect(createdRef.attach).toHaveBeenCalledTimes(1);
  });

  it('disposes overlay on dismiss', async () => {
    await service.show('Saved!', 'success');
    service.dismiss();

    expect(createdRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('shows errors through show', async () => {
    const showSpy = vi.spyOn(service, 'show').mockImplementation(() => Promise.resolve());

    await service.error('Failed!');

    expect(showSpy).toHaveBeenCalledWith('Failed!', 'error');
  });
});

describe('ToastService (integration)', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [ToastService, provideTranslocoTesting()] });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.dismiss();
    vi.useRealTimers();
  });

  it('renders a toast and removes it when the close button is clicked', async () => {
    await service.error('Download failed');
    TestBed.tick();
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Download failed');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');

    document.querySelector<HTMLButtonElement>('app-toast-container button')?.click();

    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(['success', 'error', 'info'] as const)(
    'keeps a default %s toast until manual dismissal',
    async type => {
      await service.show('Please wait', type);
      TestBed.tick();

      vi.advanceTimersByTime(60_000);
      expect(document.querySelector('app-toast-container')?.textContent).toContain('Please wait');

      service.dismiss();
      expect(document.querySelector('app-toast-container')).toBeNull();
    },
  );

  it('restores the previous focus after dismissing the toast from its close button', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    try {
      await service.error('Download failed');
      TestBed.tick();
      expect(document.activeElement).toBe(trigger);
      const close = document.querySelector<HTMLButtonElement>('app-toast-container button');
      close?.focus();
      close?.click();

      expect(document.activeElement).toBe(trigger);
      expect(document.querySelector('app-toast-container')).toBeNull();
    } finally {
      trigger.remove();
    }
  });

  it('preserves the focused close button when another message replaces the toast', async () => {
    await service.error('First message');
    TestBed.tick();
    const close = document.querySelector<HTMLButtonElement>('app-toast-container button');
    close?.focus();

    await service.show('Second message', 'info');
    TestBed.tick();

    expect(document.querySelector('app-toast-container button')).toBe(close);
    expect(document.activeElement).toBe(close);
    expect(document.querySelector('app-toast-container')?.textContent).toContain('Second message');
    vi.advanceTimersByTime(5000);
    expect(document.querySelector('app-toast-container')).not.toBeNull();
  });

  it('restores the element used to enter the toast after the initial trigger is removed', async () => {
    const initialTrigger = document.createElement('button');
    const currentAction = document.createElement('button');
    document.body.append(initialTrigger, currentAction);
    initialTrigger.focus();

    try {
      await service.error('Download failed');
      TestBed.tick();
      initialTrigger.remove();
      currentAction.focus();
      const close = document.querySelector<HTMLButtonElement>('app-toast-container button')!;
      close.focus();
      close.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );

      expect(document.querySelector('app-toast-container')).toBeNull();
      expect(document.activeElement).toBe(currentAction);
    } finally {
      initialTrigger.remove();
      currentAction.remove();
    }
  });

  it('does not move focus when an unfocused toast is dismissed', async () => {
    const action = document.createElement('button');
    document.body.appendChild(action);
    action.focus();

    try {
      await service.show('Saved', 'info');
      TestBed.tick();
      service.dismiss();
      expect(document.activeElement).toBe(action);
    } finally {
      action.remove();
    }
  });

  it('releases the overlay when its injector is destroyed', async () => {
    await service.show('Temporary message', 'info');
    TestBed.tick();
    expect(document.querySelector('app-toast-container')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(document.querySelector('app-toast-container')).toBeNull();
  });

  it('renders only the latest message when several arrive while the overlay loads', async () => {
    const first = service.error('First message');
    const second = service.show('Second message', 'info');
    await Promise.all([first, second]);
    TestBed.tick();

    expect(document.querySelectorAll('app-toast-container')).toHaveLength(1);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Second message');
  });

  it('renders nothing when dismissed before the overlay has loaded', async () => {
    const shown = service.error('Download failed');
    service.dismiss();
    await shown;
    TestBed.tick();

    expect(document.querySelector('app-toast-container')).toBeNull();
  });

  it('replaces the previous toast in place', async () => {
    await service.show('First message', 'success');
    TestBed.tick();

    await service.show('Second message', 'info');
    TestBed.tick();

    expect(document.querySelectorAll('app-toast-container')).toHaveLength(1);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Second message');
  });
});

describe('ToastService server guard', () => {
  it('does not create overlays or timers during server rendering', async () => {
    const create = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: Overlay, useValue: { create } },
      ],
    });
    TestBed.inject(ToastService).error('Download failed');
    expect(create).not.toHaveBeenCalled();
  });
});
