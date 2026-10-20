import { TranslocoService } from '@jsverse/transloco';
import type { ToastService } from '@rapaglaz/shared/ui';
import type { LoggerService } from '@rapaglaz/shared/util';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';

export function withErrorToast<T>(
  messageKey: string,
  toastService: Pick<ToastService, 'error'>,
  translocoService: TranslocoService,
  logger: LoggerService,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error: unknown) => {
        logger.error(messageKey, error);
        // fire and forget: the toast service logs a failed overlay load itself
        void toastService.error(translocoService.translate(messageKey));
        return EMPTY;
      }),
    );
}
