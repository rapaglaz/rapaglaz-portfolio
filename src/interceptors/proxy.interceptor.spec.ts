import { DOCUMENT } from '@angular/common';
import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { proxyInterceptor } from './proxy.interceptor';

describe('proxyInterceptor', () => {
  it('forwards requests in production environments', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'rapaglaz.de' } } } },
      ],
    });

    const next: HttpHandlerFn = vi.fn(req => of(req as any));
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/config' }));
  });

  it('proxies config requests on localhost', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'localhost' } } } },
      ],
    });

    const next: HttpHandlerFn = vi.fn(req => of(req as any));
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://rapaglaz.de/config' }),
    );
  });

  it('proxies download requests on 127.0.0.1', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: '127.0.0.1' } } } },
      ],
    });

    const next: HttpHandlerFn = vi.fn(req => of(req as any));
    const req = new HttpRequest('GET', '/download?file=cv/Paul_Glaz_CV_EN.pdf');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://rapaglaz.de/download?file=cv/Paul_Glaz_CV_EN.pdf',
      }),
    );
  });

  it('does not proxy non-config requests on localhost', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'localhost' } } } },
      ],
    });

    const next: HttpHandlerFn = vi.fn(req => of(req as any));
    const req = new HttpRequest('GET', '/assets/logo.svg');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/assets/logo.svg' }));
  });
});
