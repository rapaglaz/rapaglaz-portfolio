import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
        instance: {
          data: { set: vi.fn() },
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
});
