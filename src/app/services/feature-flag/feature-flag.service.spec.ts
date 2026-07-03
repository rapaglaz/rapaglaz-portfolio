import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

// Resource values resolve through the loader's promise, so tests must yield
// to the microtask queue before asserting on the resource state.
const settle = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0));
  TestBed.tick();
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

  it('resolves the flag value from a valid response', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flag = service.getFlag(flagName);
    TestBed.tick();

    expect(flag.isLoading()).toBe(true);
    expect(flag.value()).toBe(false);

    const req = httpMock.expectOne(flagUrlWithName);
    expect(req.request.method).toBe('GET');
    req.flush({ openToWork: true });
    await settle();

    expect(flag.isLoading()).toBe(false);
    expect(flag.value()).toBe(true);
    expect(flag.error()).toBeUndefined();
  });

  it('returns false when the response does not contain the flag', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flag = service.getFlag(flagName);
    TestBed.tick();

    httpMock.expectOne(flagUrlWithName).flush({});
    await settle();

    expect(flag.value()).toBe(false);
  });

  it('returns false when the response is not an object', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flag = service.getFlag(flagName);
    TestBed.tick();

    httpMock.expectOne(flagUrlWithName).flush('invalid');
    await settle();

    expect(flag.value()).toBe(false);
  });

  it('falls back to the default value on request error', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const flag = service.getFlag(flagName);
    TestBed.tick();

    const req = httpMock.expectOne(flagUrlWithName);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    await settle();

    expect(flag.isLoading()).toBe(false);
    // In the error state value() throws, so consumers must guard with hasValue().
    expect(flag.hasValue()).toBe(false);
    expect(flag.error()).toBeDefined();
  });

  it('caches the resource so repeated calls share one request', async () => {
    const { service, httpMock: currentHttpMock, flagName, flagUrlWithName } = createHarness();
    httpMock = currentHttpMock;

    const first = service.getFlag(flagName);
    const second = service.getFlag(flagName);
    TestBed.tick();

    expect(first).toBe(second);

    httpMock.expectOne(flagUrlWithName).flush({ openToWork: true });
    await settle();

    expect(first.value()).toBe(true);
    expect(second.value()).toBe(true);
  });

  it('does not request flags on the server platform', () => {
    const {
      service,
      httpMock: currentHttpMock,
      flagName,
      flagUrlWithName,
    } = createHarness('server');
    httpMock = currentHttpMock;

    const flag = service.getFlag(flagName);
    TestBed.tick();

    httpMock.expectNone(flagUrlWithName);
    expect(flag.status()).toBe('idle');
    expect(flag.value()).toBe(false);
  });
});
