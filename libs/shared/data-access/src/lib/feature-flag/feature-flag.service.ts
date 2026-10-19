import { isPlatformBrowser } from '@angular/common';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { computed, inject, Injectable, Injector, PLATFORM_ID, Signal } from '@angular/core';
import { API_FEATURE_FLAG_URL } from '@rapaglaz/shared/util';
import * as v from 'valibot';

// The Worker answers { "<name>": true | false }; any other shape reads as false
export function readFlagValue(raw: unknown, flagName: string): boolean {
  const result = v.safeParse(v.object({ [flagName]: v.boolean() }), raw);
  return result.success && result.output[flagName];
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private readonly flagUrl = inject(API_FEATURE_FLAG_URL);
  private readonly platformId = inject(PLATFORM_ID);
  // Resources are cached beyond the calling component's lifetime, so they must
  // be bound to the root injector instead of the caller's injection context.
  private readonly injector = inject(Injector);
  private readonly cache = new Map<string, HttpResourceRef<boolean>>();

  // hasValue() guards value(), which throws while the resource is in the error state
  getFlagValue(name: string): Signal<boolean> {
    const resource = this.getFlag(name);
    return computed(() => resource.hasValue() && resource.value());
  }

  getFlag(name: string): HttpResourceRef<boolean> {
    let resource = this.cache.get(name);
    if (!resource) {
      resource = httpResource(
        () =>
          isPlatformBrowser(this.platformId)
            ? `${this.flagUrl}/${encodeURIComponent(name)}`
            : undefined,
        {
          parse: raw => readFlagValue(raw, name),
          defaultValue: false,
          injector: this.injector,
        },
      );
      this.cache.set(name, resource);
    }
    return resource;
  }
}
