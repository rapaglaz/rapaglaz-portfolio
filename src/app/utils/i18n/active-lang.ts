import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

// call from an injection context (field initializer / constructor)
export function injectActiveLang(): Signal<string> {
  const transloco = inject(TranslocoService);
  return toSignal(transloco.langChanges$, { initialValue: transloco.getActiveLang() });
}
