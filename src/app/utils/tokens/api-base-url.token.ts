import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

const PRODUCTION_URL = 'https://rapaglaz.de';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: (): string => {
    const hostname = inject(DOCUMENT).defaultView?.location.hostname ?? '';
    return needsCrossOriginApi(hostname) ? PRODUCTION_URL : '';
  },
});

function needsCrossOriginApi(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'rapaglaz.github.io';
}
