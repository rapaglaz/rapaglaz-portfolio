import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export type FeatureFlagResponse = Record<string, boolean>;

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly flagUrl = 'https://rapaglaz.de/feature-flag';

  getFlag$(flagName: string): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    const trimmedName = flagName.trim();
    if (trimmedName.length === 0) {
      return of(false);
    }

    const url = `${this.flagUrl}/${encodeURIComponent(trimmedName)}`;

    return this.http
      .get<FeatureFlagResponse>(url, { headers: { Accept: 'application/json' } })
      .pipe(
        map(data => this.readFlagValue(data, trimmedName)),
        catchError(() => of(false)),
      );
  }

  private readFlagValue(value: FeatureFlagResponse, flagName: string): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return typeof value[flagName] === 'boolean' ? value[flagName] : false;
  }
}
