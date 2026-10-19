import { TranslocoService } from '@jsverse/transloco';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';
import type { LoggerService } from '../logging/logger.service';

// Only the method the operator calls: utilities cannot depend on the ToastService in shared-ui
export type ErrorToast = { error(message: string): unknown };

export function withErrorToast<T>(
  messageKey: string,
  toastService: ErrorToast,
  translocoService: TranslocoService,
  logger: LoggerService,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error: unknown) => {
        logger.error(messageKey, error);
        toastService.error(translocoService.translate(messageKey));
        return EMPTY;
      }),
    );
}
