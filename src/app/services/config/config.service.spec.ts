import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;

    TestBed.configureTestingModule({
      providers: [ConfigService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.stubGlobal('location', originalLocation);
  });

  it('uses test key on localhost', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'localhost',
    });

    const config = await firstValueFrom(service.getConfig());

    expect(config.turnstileSiteKey).toBe('1x00000000000000000000AA');
    httpMock.expectNone('./config');
  });

  it('uses test key on 127.0.0.1', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: '127.0.0.1',
    });

    const config = await firstValueFrom(service.getConfig());

    expect(config.turnstileSiteKey).toBe('1x00000000000000000000AA');
    httpMock.expectNone('./config');
    httpMock.expectNone('./config');
  });

  it('fetches config from endpoint for GitHub Pages', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.github.io',
    });

    const mockConfig = { turnstileSiteKey: 'production-key-123' };
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    const config = await configPromise;
    expect(config).toEqual(mockConfig);
  });

  it('fetches config from endpoint for GitHub Pages', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.github.io',
    });

    const mockConfig = { turnstileSiteKey: 'production-key-123' };
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    const config = await configPromise;
    expect(config).toEqual(mockConfig);
  });

  it('fetches production config from endpoint', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const mockConfig = { turnstileSiteKey: 'production-key-123' };
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    const config = await configPromise;
    expect(config).toEqual(mockConfig);
  });

  it('throws error when config response is missing turnstileSiteKey', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const invalidConfig = {};
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    req.flush(invalidConfig);

    await expect(configPromise).rejects.toThrow(/Invalid config response/);
  });

  it('throws error when config response has empty turnstileSiteKey', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const invalidConfig = { turnstileSiteKey: '' };
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    req.flush(invalidConfig);

    await expect(configPromise).rejects.toThrow(/Invalid config response/);
  });

  it('throws error when config response has wrong type for turnstileSiteKey', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const invalidConfig = { turnstileSiteKey: 12345 };
    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    req.flush(invalidConfig);

    await expect(configPromise).rejects.toThrow(/Invalid config response/);
  });

  it('wraps network errors in descriptive error message', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const configPromise = firstValueFrom(service.getConfig());

    const req = httpMock.expectOne('./config');
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Internal Server Error' });

    await expect(configPromise).rejects.toThrow(/Failed to fetch config/);
  });

  it('caches config response - multiple calls make only one HTTP request', async () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      hostname: 'rapaglaz.de',
    });

    const mockConfig = { turnstileSiteKey: 'cached-key-123' };

    // Make first call
    const config1Promise = firstValueFrom(service.getConfig());

    // Verify HTTP request is made
    const req = httpMock.expectOne('./config');
    req.flush(mockConfig);

    const config1 = await config1Promise;
    expect(config1).toEqual(mockConfig);

    // Make second call
    const config2 = await firstValueFrom(service.getConfig());

    // Verify same config is returned without making another HTTP request
    expect(config2).toEqual(mockConfig);
    httpMock.expectNone('./config');
  });
});
