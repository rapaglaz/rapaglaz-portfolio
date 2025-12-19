import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';

const PRODUCTION_URL = 'https://rapaglaz.de';

export function proxyInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const document = inject(DOCUMENT);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const win = document.defaultView;

  if (!win || !isLocalhost(win.location.hostname)) {
    return next(req);
  }

  if (req.url === '/config' || req.url.startsWith('/download')) {
    const proxiedReq = req.clone({
      url: `${PRODUCTION_URL}${req.url}`,
    });
    return next(proxiedReq);
  }

  return next(req);
}

function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
