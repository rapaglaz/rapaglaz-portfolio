import { HttpContext, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { TURNSTILE_TOKEN } from '../services/cv-download/cv-download.service';
import { turnstileInterceptor } from './turnstile.interceptor';

describe('turnstileInterceptor', () => {
  it('adds turnstile header when token provided', () => {
    const context = new HttpContext().set(TURNSTILE_TOKEN, 'token-123');
    const req = new HttpRequest('GET', '/test', { context });

    let captured: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = request => {
      captured = request;
      return request as any;
    };

    turnstileInterceptor(req, next);

    expect(captured?.headers.get('cf-turnstile-response')).toBe('token-123');
  });

  it('passes through unchanged when token missing', () => {
    const req = new HttpRequest('GET', '/test');

    let captured: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = request => {
      captured = request;
      return request as any;
    };

    turnstileInterceptor(req, next);

    expect(captured).toBeDefined();
    expect(captured?.headers.has('cf-turnstile-response')).toBe(false);
  });
});
