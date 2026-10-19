import { TranslocoService } from '@jsverse/transloco';
import type { LoggerService } from '@rapaglaz/shared/util';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';
import type { ToastService } from './toast.service';

export function withErrorToast<T>(
  messageKey: string,
  toastService: ToastService,
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
