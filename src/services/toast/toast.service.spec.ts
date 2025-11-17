import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

type OverlayRefStub = {
  attach: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  dataSet: ReturnType<typeof vi.fn>;
  dismissedSubscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  latestDismissHandler: (() => void) | null;
};

describe('ToastService', () => {
  let service: ToastService;
  let overlayMock: { create: ReturnType<typeof vi.fn>; position: ReturnType<typeof vi.fn> };
  let overlayRefs: OverlayRefStub[];
  let positionStrategy: {
    top: ReturnType<typeof vi.fn>;
    left: ReturnType<typeof vi.fn>;
    right: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    overlayRefs = [];
    positionStrategy = {
      top: vi.fn().mockReturnThis(),
      left: vi.fn().mockReturnThis(),
      right: vi.fn().mockReturnThis(),
    };

    overlayMock = {
      create: vi.fn(),
      position: vi.fn(() => ({
        global: vi.fn(() => positionStrategy),
      })),
    };

    overlayMock.create.mockImplementation(() => {
      const ref: OverlayRefStub = {
        attach: vi.fn(),
        dispose: vi.fn(),
        dataSet: vi.fn(),
        dismissedSubscribe: vi.fn(),
        unsubscribe: vi.fn(),
        latestDismissHandler: null,
      };

      ref.attach.mockImplementation(
        () =>
          ({
            instance: {
              data: { set: ref.dataSet },
              dismissed: { subscribe: ref.dismissedSubscribe },
            },
          }) as unknown,
      );

      ref.dismissedSubscribe.mockImplementation((handler: () => void) => {
        ref.latestDismissHandler = handler;
        return { unsubscribe: ref.unsubscribe };
      });

      overlayRefs.push(ref);
      return ref as unknown as OverlayRef;
    });

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        provideZonelessChangeDetection(),
        { provide: Overlay, useValue: overlayMock },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('creates overlay with toast data', () => {
    service.show('Saved!', 'success');

    expect(overlayMock.create).toHaveBeenCalledTimes(1);
    expect(positionStrategy.top).toHaveBeenCalledWith('5rem');

    const ref = overlayRefs.at(-1);
    expect(ref?.dataSet).toHaveBeenCalledWith({ message: 'Saved!', type: 'success' });
    expect(ref?.dismissedSubscribe).toHaveBeenCalledTimes(1);
  });

  it('replaces existing toast', () => {
    vi.useFakeTimers();

    service.show('First', 'info', 10_000);
    const firstRef = overlayRefs[0];

    service.show('Second', 'error', 5_000);

    expect(firstRef.dispose).toHaveBeenCalledTimes(1);
    expect(firstRef.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after timeout', () => {
    vi.useFakeTimers();

    service.show('Temp message', 'info', 1_000);
    const ref = overlayRefs[0];

    vi.advanceTimersByTime(1_000);
    expect(ref.dispose).toHaveBeenCalledTimes(1);
  });

  it('cleans up when dismissed', () => {
    service.show('User closed', 'info');
    const ref = overlayRefs[0];

    ref.latestDismissHandler?.();

    expect(ref.dispose).toHaveBeenCalledTimes(1);
    expect(ref.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('cancels timer on manual dismiss', () => {
    vi.useFakeTimers();

    service.show('Manual dismiss', 'info', 1_000);
    const ref = overlayRefs[0];

    service.dismiss();
    expect(ref.dispose).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_000);
    expect(ref.dispose).toHaveBeenCalledTimes(1);
  });

  it('convenience methods call show', () => {
    const showSpy = vi.spyOn(service, 'show').mockImplementation(() => undefined);

    service.success('All good', 2_000);
    service.error('Bad news');
    service.info('FYI', 3_000);

    expect(showSpy).toHaveBeenNthCalledWith(1, 'All good', 'success', 2_000);
    expect(showSpy).toHaveBeenNthCalledWith(2, 'Bad news', 'error', 15_000);
    expect(showSpy).toHaveBeenNthCalledWith(3, 'FYI', 'info', 3_000);
  });
});
