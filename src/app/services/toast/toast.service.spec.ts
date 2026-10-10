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

  it('creates overlay when showing toast', () => {
    service.show('Saved!', 'success');

    expect(overlayMock.create).toHaveBeenCalledTimes(1);
    expect(createdRef.attach).toHaveBeenCalledTimes(1);
  });

  it('disposes overlay on dismiss', () => {
    service.show('Saved!', 'success');
    service.dismiss();

    expect(createdRef.dispose).toHaveBeenCalledTimes(1);
  });

  it('delegates convenience methods to show', () => {
    const showSpy = vi.spyOn(service, 'show').mockImplementation(() => undefined);

    service.success('Saved!', 1000);
    service.error('Failed!', 2000);
    service.info('Heads up!', 3000);

    expect(showSpy).toHaveBeenNthCalledWith(1, 'Saved!', 'success', 1000);
    expect(showSpy).toHaveBeenNthCalledWith(2, 'Failed!', 'error', 2000);
    expect(showSpy).toHaveBeenNthCalledWith(3, 'Heads up!', 'info', 3000);
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

  it('renders a toast and removes it when the close button is clicked', () => {
    service.error('Download failed');
    TestBed.tick();
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Download failed');
    expect(alert?.getAttribute('aria-live')).toBe('assertive');

    document.querySelector<HTMLButtonElement>('app-toast-container button')?.click();

    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it.each(['success', 'error', 'info'] as const)(
    'keeps a default %s toast until manual dismissal',
    type => {
      service.show('Please wait', type);
      TestBed.tick();

      vi.advanceTimersByTime(60_000);
      expect(document.querySelector('app-toast-container')?.textContent).toContain('Please wait');

      service.dismiss();
      expect(document.querySelector('app-toast-container')).toBeNull();
    },
  );

  it('restores the previous focus after dismissing the toast from its close button', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    try {
      service.error('Download failed');
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

  it('pauses an explicit timeout while the close button has focus', () => {
    service.info('Temporary message', 1000);
    TestBed.tick();
    document.querySelector<HTMLButtonElement>('app-toast-container button')?.focus();

    vi.advanceTimersByTime(5000);
    expect(document.querySelector('app-toast-container')?.textContent).toContain(
      'Temporary message',
    );
    expect(document.activeElement).toBe(document.querySelector('app-toast-container button'));
  });

  it('preserves the focused close button when another message replaces the toast', () => {
    service.error('First message');
    TestBed.tick();
    const close = document.querySelector<HTMLButtonElement>('app-toast-container button');
    close?.focus();

    service.info('Second message', 1000);
    TestBed.tick();

    expect(document.querySelector('app-toast-container button')).toBe(close);
    expect(document.activeElement).toBe(close);
    expect(document.querySelector('app-toast-container')?.textContent).toContain('Second message');
    vi.advanceTimersByTime(5000);
    expect(document.querySelector('app-toast-container')).not.toBeNull();
  });

  it('restarts the full timeout after both hover and focus leave the toast', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    try {
      service.info('Temporary message', 1000);
      TestBed.tick();
      const close = document.querySelector<HTMLButtonElement>('app-toast-container button')!;
      const panel = close.closest<HTMLElement>('.cdk-overlay-pane')!;
      vi.advanceTimersByTime(500);
      panel.dispatchEvent(new MouseEvent('mouseenter'));
      close.focus();
      panel.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(5000);
      expect(document.querySelector('app-toast-container')).not.toBeNull();

      panel.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.focus();
      vi.advanceTimersByTime(5000);
      expect(document.querySelector('app-toast-container')).not.toBeNull();

      panel.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(999);
      expect(document.querySelector('app-toast-container')).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(document.querySelector('app-toast-container')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });

  it('restores the element used to enter the toast after the initial trigger is removed', () => {
    const initialTrigger = document.createElement('button');
    const currentAction = document.createElement('button');
    document.body.append(initialTrigger, currentAction);
    initialTrigger.focus();

    try {
      service.error('Download failed');
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

  it('does not move focus when an unfocused toast is dismissed', () => {
    const action = document.createElement('button');
    document.body.appendChild(action);
    action.focus();

    try {
      service.info('Saved');
      TestBed.tick();
      service.dismiss();
      expect(document.activeElement).toBe(action);
    } finally {
      action.remove();
    }
  });

  it('releases the overlay and timers when its injector is destroyed', () => {
    service.info('Temporary message', 1000);
    TestBed.tick();
    expect(document.querySelector('app-toast-container')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(document.querySelector('app-toast-container')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, -1])('keeps a toast until manual dismissal when duration is %s', duration => {
    service.show('Persistent message', 'info', duration);
    TestBed.tick();

    vi.advanceTimersByTime(60_000);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Persistent message');

    service.dismiss();
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it('replaces the previous toast and cancels its dismissal timer', () => {
    service.success('First message', 1000);
    TestBed.tick();
    vi.advanceTimersByTime(500);

    service.info('Second message', 2000);
    TestBed.tick();
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Second message');

    vi.advanceTimersByTime(500);
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Second message');

    vi.advanceTimersByTime(1500);
    expect(document.querySelector('[role="status"]')).toBeNull();
  });
});

describe('ToastService server guard', () => {
  it('does not create overlays or timers during server rendering', () => {
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
