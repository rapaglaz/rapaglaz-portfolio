import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoggerService, ToastService } from '../../services';
import { withErrorToast } from './with-error-toast.operator';

describe('withErrorToast', () => {
  let mockToastService: { error: ReturnType<typeof vi.fn> };
  let mockTranslocoService: { translate: ReturnType<typeof vi.fn> };
  let mockLogger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockToastService = {
      error: vi.fn(),
    };

    mockTranslocoService = {
      translate: vi.fn().mockReturnValue('Translated error message'),
    };

    mockLogger = {
      error: vi.fn(),
    };
  });

  it('shows error toast on stream error and completes without re-throwing', async () => {
    const originalError = new Error('Test error');
    const error$ = throwError(() => originalError);

    await new Promise<void>((resolve, reject) => {
      error$
        .pipe(
          withErrorToast(
            'error.key',
            mockToastService as unknown as ToastService,
            mockTranslocoService as unknown as TranslocoService,
            mockLogger as unknown as LoggerService,
          ),
        )
        .subscribe({
          error: () => reject(new Error('Expected complete, not error')),
          complete: () => {
            expect(mockLogger.error).toHaveBeenCalledWith('error.key', originalError);
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
            'error.key',
            mockToastService as unknown as ToastService,
            mockTranslocoService as unknown as TranslocoService,
            mockLogger as unknown as LoggerService,
          ),
        )
        .subscribe({
          next: value => {
            expect(value).toBe(42);
            expect(mockToastService.error).not.toHaveBeenCalled();
            expect(mockLogger.error).not.toHaveBeenCalled();
          },
          complete: () => resolve(),
        });
    });
  });
});
