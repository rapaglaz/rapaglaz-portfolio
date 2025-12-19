import { inject, isDevMode } from '@angular/core';
import { TranslocoMissingHandler } from '@jsverse/transloco';
import { LoggerService } from '../../services/logger/logger.service';

export class StrictTranslocoMissingHandler implements TranslocoMissingHandler {
  private readonly loggerService = inject(LoggerService);

  handle(key: string): string {
    const errorMessage = `Missing translation key: "${key}"`;

    if (isDevMode()) {
      this.loggerService.warn(errorMessage);
    } else {
      this.loggerService.error(errorMessage);
    }

    return key;
  }
}
