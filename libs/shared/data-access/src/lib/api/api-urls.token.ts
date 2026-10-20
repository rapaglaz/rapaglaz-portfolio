import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

const PRODUCTION_URL = 'https://rapaglaz.de';
// pnpm nx serve cv-download runs the download Worker here
const LOCAL_WORKER_URL = 'http://localhost:8787';

function apiBaseUrl(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return LOCAL_WORKER_URL;
  }
  return hostname === 'rapaglaz.github.io' ? PRODUCTION_URL : '';
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: (): string => {
    const hostname = inject(DOCUMENT).defaultView?.location.hostname ?? '';
    return apiBaseUrl(hostname);
  },
});

export const API_FEATURE_FLAG_URL = new InjectionToken<string>('FEATURE_FLAG_URL', {
  providedIn: 'root',
  factory: (): string => {
    return `${PRODUCTION_URL}/feature-flag`;
  },
});
