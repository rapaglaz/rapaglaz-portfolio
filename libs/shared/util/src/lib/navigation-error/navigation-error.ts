import { inject } from '@angular/core';
import { NavigationError, RedirectCommand, Router } from '@angular/router';
import { AVAILABLE_LANGS } from '../i18n/languages/languages';
import { LoggerService } from '../logging/logger.service';

export const ERROR_PATH = 'error';

const ERROR_URL = new RegExp(`^/(?:(?:${AVAILABLE_LANGS.join('|')})/)?${ERROR_PATH}(?:[/?#]|$)`);

// A navigation fails when a lazy chunk cannot load, for example after a deploy removed the old
// file. Without a handler the visitor would stay on a blank page. The address stays as it is, so
// a reload retries the page the visitor asked for.
export function handleNavigationError(error: NavigationError): RedirectCommand | undefined {
  // an error on the error page itself must not start a loop
  if (ERROR_URL.test(error.url)) {
    return undefined;
  }

  inject(LoggerService).error(`Navigation to ${error.url.split(/[?#]/)[0]} failed`, error.error);

  return new RedirectCommand(inject(Router).parseUrl(`/${ERROR_PATH}`), {
    skipLocationChange: true,
  });
}
