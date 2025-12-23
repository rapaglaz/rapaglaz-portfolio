import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, shareReplay, startWith } from 'rxjs';

export type FeatureFlagResponse = Record<string, boolean>;
export type FeatureFlagValue = boolean | null;

export type FeatureFlagSignal = {
  flag: Signal<FeatureFlagValue>;
  isLoaded: Signal<boolean>;
};

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly flagUrl = 'https://rapaglaz.de/feature-flag';
  private readonly observableCache = new Map<string, Observable<FeatureFlagValue>>();
  private readonly signalCache = new Map<string, FeatureFlagSignal>();

  getFlagSignal(flagName: string): FeatureFlagSignal {
    if (!isPlatformBrowser(this.platformId)) {
      return this.createNullSignal();
    }

    const trimmedName = flagName.trim();
    if (trimmedName.length === 0) {
      return this.createNullSignal();
    }

    const cached = this.signalCache.get(trimmedName);
    if (cached) {
      return cached;
    }

    const flag$ = this.getOrCreateFlagObservable(trimmedName);
    const flag = toSignal(flag$, { initialValue: null });
    const isLoaded = computed(() => flag() !== null);

    const signalPair: FeatureFlagSignal = { flag, isLoaded };
    this.signalCache.set(trimmedName, signalPair);

    return signalPair;
  }

  getFlag$(flagName: string): Observable<FeatureFlagValue> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    const trimmedName = flagName.trim();
    if (trimmedName.length === 0) {
      return of(false);
    }

    return this.getOrCreateFlagObservable(trimmedName);
  }

  private getOrCreateFlagObservable(trimmedName: string): Observable<FeatureFlagValue> {
    const cached = this.observableCache.get(trimmedName);
    if (cached) {
      return cached;
    }

    const url = `${this.flagUrl}/${encodeURIComponent(trimmedName)}`;

    const request$ = this.http
      .get<FeatureFlagResponse>(url, { headers: { Accept: 'application/json' } })
      .pipe(
        map(data => this.readFlagValue(data, trimmedName)),
        startWith(null),
        catchError(() => of(false)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

    this.observableCache.set(trimmedName, request$);
    return request$;
  }

  private createNullSignal(): FeatureFlagSignal {
    // For SSR or invalid names we treat flag as "not fetched" but loaded, so the UI can render
    // without waiting for a request and still hide badge content.
    const flag = toSignal(of(null), { initialValue: null });
    const isLoaded = computed(() => true);
    return { flag, isLoaded };
  }

  private readFlagValue(value: FeatureFlagResponse, flagName: string): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return typeof value[flagName] === 'boolean' ? value[flagName] : false;
  }
}
