import { TranslocoService } from '@jsverse/transloco';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';
import type { LoggerService, ToastService } from '../../services';

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
