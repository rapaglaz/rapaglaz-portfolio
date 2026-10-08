import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    TestBed.configureTestingModule({ providers: [ToastService] });
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

    alert?.querySelector<HTMLButtonElement>('button')?.click();

    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('dismisses a toast at the default duration', () => {
    service.info('Please wait');
    TestBed.tick();

    vi.advanceTimersByTime(14_999);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Please wait');

    vi.advanceTimersByTime(1);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it.each([0, -1])('keeps a toast until manual dismissal when duration is %s', duration => {
    service.show('Persistent message', 'info', duration);
    TestBed.tick();

    vi.advanceTimersByTime(60_000);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Persistent message');

    service.dismiss();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('replaces the previous toast and cancels its dismissal timer', () => {
    service.success('First message', 1000);
    TestBed.tick();
    vi.advanceTimersByTime(500);

    service.info('Second message', 2000);
    TestBed.tick();
    expect(document.querySelectorAll('[role="alert"]')).toHaveLength(1);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Second message');

    vi.advanceTimersByTime(500);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Second message');

    vi.advanceTimersByTime(1500);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});
