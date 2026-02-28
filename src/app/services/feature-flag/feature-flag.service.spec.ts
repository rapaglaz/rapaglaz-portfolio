import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { API_FEATURE_FLAG_URL } from '../../utils/tokens/api-urls.token';
import { FeatureFlagService } from './feature-flag.service';

type Platform = 'browser' | 'server';

type FeatureFlagHarness = {
  service: FeatureFlagService;
  httpMock: HttpTestingController;
  flagName: string;
  flagUrl: string;
  flagUrlWithName: string;
};

const createHarness = (platformId: Platform = 'browser'): FeatureFlagHarness => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      FeatureFlagService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });

  const service = TestBed.inject(FeatureFlagService);
  const httpMock = TestBed.inject(HttpTestingController);
  const flagUrl = TestBed.inject(API_FEATURE_FLAG_URL);
  const flagName = 'openToWork';

  return {
    service,
    httpMock,
    flagName,
    flagUrl,
    flagUrlWithName: `${flagUrl}/${flagName}`,
  };
};

describe('FeatureFlagService', () => {
  let httpMock: HttpTestingController;

  afterEach(() => {
    httpMock.verify();
  });

  it('returns true for valid response', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flagPromise = lastValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    expect(req.request.method).toBe('GET');
    req.flush({ openToWork: true });

    await expect(flagPromise).resolves.toBe(true);
  });

  it('returns false when response is invalid', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flagPromise = lastValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    req.flush({});

    await expect(flagPromise).resolves.toBe(false);
  });

  it('returns false on request error', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flagPromise = lastValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    await expect(flagPromise).resolves.toBe(false);
  });

  it('reuses a cached flag observable for multiple subscribers', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const first$ = service.getFlag$(flagName);
    const second$ = service.getFlag$(flagName);

    const flagsPromise = Promise.all([lastValueFrom(first$), lastValueFrom(second$)]);

    const req = httpMock.expectOne(flagUrlWithName);
    expect(req.request.method).toBe('GET');
    req.flush({ openToWork: true });

    await expect(flagsPromise).resolves.toEqual([true, true]);
  });

  it('does not request flags on the server platform', async () => {
    const {
      service,
      httpMock: currentHttpMock,
      flagName,
      flagUrlWithName,
    } = createHarness('server');
    httpMock = currentHttpMock;

    await expect(firstValueFrom(service.getFlag$(flagName))).resolves.toBe(null);

    httpMock.expectNone(flagUrlWithName);
  });
});

describe('FeatureFlagService - Signal API', () => {
  let httpMock: HttpTestingController;

  afterEach(() => {
    httpMock.verify();
  });

  it('returns signal pair with flag and isLoaded', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const { flag, isLoaded } = TestBed.runInInjectionContext(() => service.getFlagSignal(flagName));

    expect(flag()).toBe(null);
    expect(isLoaded()).toBe(false);

    const req = httpMock.expectOne(flagUrlWithName);
    req.flush({ openToWork: true });

    // Wait for signal to update
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(flag()).toBe(true);
    expect(isLoaded()).toBe(true);
  });

  it('caches signal pairs to avoid redundant toSignal calls', () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const first = TestBed.runInInjectionContext(() => service.getFlagSignal(flagName));
    const second = TestBed.runInInjectionContext(() => service.getFlagSignal(flagName));

    expect(first).toBe(second);
    expect(first.flag).toBe(second.flag);
    expect(first.isLoaded).toBe(second.isLoaded);

    // Only one HTTP request despite multiple getFlagSignal calls
    const req = httpMock.expectOne(flagUrlWithName);
    req.flush({ openToWork: true });
  });

  it('returns loaded=true for SSR without making requests', () => {
    const {
      service,
      httpMock: currentHttpMock,
      flagName,
      flagUrlWithName,
    } = createHarness('server');
    httpMock = currentHttpMock;

    const { flag, isLoaded } = TestBed.runInInjectionContext(() => service.getFlagSignal(flagName));

    expect(flag()).toBe(null);
    expect(isLoaded()).toBe(true);

    httpMock.expectNone(flagUrlWithName);
  });

  it('returns loaded=true for empty flag name without making requests', () => {
    const { service, httpMock: currentHttpMock, flagUrl } = createHarness();
    httpMock = currentHttpMock;

    const { flag, isLoaded } = TestBed.runInInjectionContext(() => service.getFlagSignal(''));

    expect(flag()).toBe(null);
    expect(isLoaded()).toBe(true);

    httpMock.expectNone(flagUrl);
  });

  it('handles errors by setting flag to false and isLoaded to true', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const { flag, isLoaded } = TestBed.runInInjectionContext(() => service.getFlagSignal(flagName));

    const req = httpMock.expectOne(flagUrlWithName);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(flag()).toBe(false);
    expect(isLoaded()).toBe(true);
  });
});
