import { isDevMode } from '@angular/core';
import { LoggerService } from '../../services';

// fallback to 'en' when navigator missing (SSR) or invalid
export function getBrowserLanguage(loggerService: LoggerService): string {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return 'en';
  }

  const language = navigator.language;

  if (typeof language !== 'string' || language.trim() === '') {
    if (isDevMode()) {
      loggerService.warn('Invalid browser language format:', language);
    }
    return 'en';
  }

  return language.toLowerCase();
}
