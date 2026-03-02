import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, shareReplay, startWith } from 'rxjs';
import { API_FEATURE_FLAG_URL } from '../../utils/tokens/api-urls.token';
import { LoggerService } from '../logger/logger.service';

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
  private readonly flagUrl = inject(API_FEATURE_FLAG_URL);
  private readonly logger = inject(LoggerService);
  private readonly MAX_CACHE_SIZE = 50;
  private readonly observableCache = new Map<string, Observable<FeatureFlagValue>>();
  private readonly signalCache = new Map<string, FeatureFlagSignal>();
  // Sentinel for SSR and invalid flag names.
  private readonly nullSignal: FeatureFlagSignal = {
    flag: signal<FeatureFlagValue>(null),
    isLoaded: signal(true).asReadonly(),
  };

  getFlagSignal(flagName: string): FeatureFlagSignal {
    if (!isPlatformBrowser(this.platformId)) {
      return this.nullSignal;
    }

    const trimmedName = flagName.trim();
    if (trimmedName.length === 0) {
      return this.nullSignal;
    }

    const cached = this.signalCache.get(trimmedName);
    if (cached) {
      // Move to end so eviction removes the least-recently-used entry.
      this.signalCache.delete(trimmedName);
      this.signalCache.set(trimmedName, cached);
      return cached;
    }

    const flag$ = this.getOrCreateFlagObservable(trimmedName);
    const flag = toSignal(flag$, { initialValue: null });
    const isLoaded = computed(() => flag() !== null);

    const signalPair: FeatureFlagSignal = { flag, isLoaded };
    this.evictIfFull(this.signalCache);
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
      // Move to end so eviction removes the least-recently-used entry.
      this.observableCache.delete(trimmedName);
      this.observableCache.set(trimmedName, cached);
      return cached;
    }

    const url = `${this.flagUrl}/${encodeURIComponent(trimmedName)}`;

    const request$ = this.http
      .get<FeatureFlagResponse>(url, { headers: { Accept: 'application/json' } })
      .pipe(
        map(data => this.readFlagValue(data, trimmedName)),
        catchError((error: unknown) => {
          this.logger.error(`Failed to load flag "${trimmedName}"`, error);
          return of(false);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    const flag$ = request$.pipe(startWith(null));
    this.evictIfFull(this.observableCache);
    this.observableCache.set(trimmedName, flag$);
    return flag$;
  }

  private evictIfFull<T>(cache: Map<string, T>): void {
    if (cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }

  private readFlagValue(value: FeatureFlagResponse, flagName: string): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    return typeof value[flagName] === 'boolean' ? value[flagName] : false;
  }
}
