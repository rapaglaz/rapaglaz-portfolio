import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let httpMock: HttpTestingController;

  const flagUrl = 'https://rapaglaz.de/feature-flag';
  const flagName = 'openToWork';
  const flagUrlWithName = `${flagUrl}/${flagName}`;

  const setup = (platformId: 'browser' | 'server' = 'browser'): void => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FeatureFlagService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });

    service = TestBed.inject(FeatureFlagService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    httpMock.verify();
  });

  it('returns true for valid response', async () => {
    setup();

    const flagPromise = firstValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    expect(req.request.method).toBe('GET');
    req.flush({ openToWork: true });

    await expect(flagPromise).resolves.toBe(true);
  });

  it('returns false when response is invalid', async () => {
    setup();

    const flagPromise = firstValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    req.flush({});

    await expect(flagPromise).resolves.toBe(false);
  });

  it('returns false on request error', async () => {
    setup();

    const flagPromise = firstValueFrom(service.getFlag$(flagName));
    const req = httpMock.expectOne(flagUrlWithName);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    await expect(flagPromise).resolves.toBe(false);
  });

  it('does not request flags on the server platform', async () => {
    setup('server');

    await expect(firstValueFrom(service.getFlag$(flagName))).resolves.toBe(false);

    httpMock.expectNone(flagUrlWithName);
  });
});
