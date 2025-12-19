import { TranslocoService } from '@jsverse/transloco';
import { catchError, EMPTY, MonoTypeOperatorFunction, Observable } from 'rxjs';
import type { ToastService } from '../../services';

export function withErrorToast<T>(
  toastService: ToastService,
  messageKey: string,
  translocoService: TranslocoService,
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError(() => {
        toastService.error(translocoService.translate(messageKey));
        return EMPTY;
      }),
    );
}
