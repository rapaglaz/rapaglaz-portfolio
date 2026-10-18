import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CONTACT_LINKS } from '../../content';

// call from an injection context (field initializer / constructor)
export function injectContactEmailOpener(): () => void {
  const document = inject(DOCUMENT);
  const platformId = inject(PLATFORM_ID);

  return (): void => {
    if (!isPlatformBrowser(platformId)) return;

    document.defaultView?.location.assign(CONTACT_LINKS.email);
  };
}
