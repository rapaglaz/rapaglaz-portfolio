import { DOCUMENT } from '@angular/common';
import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { proxyInterceptor } from './proxy.interceptor';

describe('proxyInterceptor', () => {
  it('forwards requests in production environments', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'rapaglaz.de' } } } }],
    });

    const next: HttpHandlerFn = vi.fn(req => of(req as any));
    const req = new HttpRequest('GET', '/config');

    TestBed.runInInjectionContext(() => proxyInterceptor(req, next));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ url: '/config' }));
  });
});
