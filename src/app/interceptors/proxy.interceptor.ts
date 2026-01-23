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

  if (!win || !shouldProxy(win.location.hostname)) {
    return next(req);
  }

  // Handle absolute and relative paths for API endpoints
  const urlPath = req.url.replace(/^\.\//, '/');
  if (
    urlPath === '/config' ||
    urlPath.startsWith('/download') ||
    urlPath.startsWith('/feature-flag')
  ) {
    const proxiedReq = req.clone({
      url: `${PRODUCTION_URL}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`,
    });
    return next(proxiedReq);
  }

  return next(req);
}

function shouldProxy(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'rapaglaz.github.io';
}
