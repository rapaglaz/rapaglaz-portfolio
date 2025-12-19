import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToastService } from '../../services';
import { withErrorToast } from './with-error-toast.operator';

describe('withErrorToast', () => {
  let mockToastService: { error: ReturnType<typeof vi.fn> };
  let mockTranslocoService: { translate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockToastService = {
      error: vi.fn(),
    };

    mockTranslocoService = {
      translate: vi.fn().mockReturnValue('Translated error message'),
    };
  });

  it('shows error toast on stream error', async () => {
    const error$ = throwError(() => new Error('Test error'));

    await new Promise<void>(resolve => {
      error$
        .pipe(
          withErrorToast(
            mockToastService as unknown as ToastService,
            'error.key',
            mockTranslocoService as unknown as TranslocoService,
          ),
        )
        .subscribe({
          complete: () => {
            expect(mockTranslocoService.translate).toHaveBeenCalledWith('error.key');
            expect(mockToastService.error).toHaveBeenCalledWith('Translated error message');
            resolve();
          },
        });
    });
  });

  it('passes through successful values unchanged', async () => {
    await new Promise<void>(resolve => {
      of(42)
        .pipe(
          withErrorToast(
            mockToastService as unknown as ToastService,
            'error.key',
            mockTranslocoService as unknown as TranslocoService,
          ),
        )
        .subscribe({
          next: value => {
            expect(value).toBe(42);
            expect(mockToastService.error).not.toHaveBeenCalled();
          },
          complete: () => resolve(),
        });
    });
  });
});
