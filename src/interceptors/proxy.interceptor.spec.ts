import { DOCUMENT } from '@angular/common';
import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proxyInterceptor } from './proxy.interceptor';

describe('proxyInterceptor', () => {
  let next: HttpHandlerFn;

  function setupDocument(hostname: string): void {
    const doc = {
      defaultView: { location: { hostname } },
    } as unknown as Document;

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: DOCUMENT, useValue: doc }],
    });
  }

  beforeEach(() => {
    next = vi.fn((req: HttpRequest<unknown>) => of(req as any));
    setupDocument('localhost');
  });

  it('proxies /config requests to production', () => {
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://rapaglaz.de/config' }),
    );
  });

  it('proxies /download requests with query params', () => {
    const req = new HttpRequest('GET', '/download?file=cv.pdf');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://rapaglaz.de/download?file=cv.pdf' }),
    );
  });

  it('ignores other endpoints', () => {
    const req = new HttpRequest('GET', '/api/users');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/users' }));
  });

  it('does nothing in production', () => {
    setupDocument('rapaglaz.de');
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/config' }));
  });

  it('recognizes 127.0.0.1 as local', () => {
    setupDocument('127.0.0.1');
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://rapaglaz.de/config' }),
    );
  });

  it('handles missing window', () => {
    TestBed.overrideProvider(DOCUMENT, { useValue: { defaultView: null } as unknown as Document });
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/config' }));
  });
});
