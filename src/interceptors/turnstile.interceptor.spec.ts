import { HttpContext, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TURNSTILE_TOKEN } from '../services/cv-download/cv-download.service';
import { turnstileInterceptor } from './turnstile.interceptor';

describe('turnstileInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('adds "cf-turnstile-response" header when token in context', () => {
    const token = 'test-token-123';
    const context = new HttpContext().set(TURNSTILE_TOKEN, token);
    const req = new HttpRequest('GET', '/test', { context });

    let capturedReq: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = request => {
      capturedReq = request;
      return request as any;
    };

    turnstileInterceptor(req, next);

    expect(capturedReq?.headers.get('cf-turnstile-response')).toBe(token);
  });

  it('passes request unchanged when no token', () => {
    const req = new HttpRequest('GET', '/test', { context: new HttpContext() });

    let capturedReq: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = request => {
      capturedReq = request;
      return request as any;
    };

    turnstileInterceptor(req, next);

    expect(capturedReq).toBe(req);
    expect(capturedReq?.headers.has('cf-turnstile-response')).toBe(false);
  });

  it('passes request unchanged when token is null', () => {
    const context = new HttpContext().set(TURNSTILE_TOKEN, null);
    const req = new HttpRequest('GET', '/test', { context });

    let capturedReq: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = request => {
      capturedReq = request;
      return request as any;
    };

    turnstileInterceptor(req, next);

    expect(capturedReq).toBe(req);
    expect(capturedReq?.headers.has('cf-turnstile-response')).toBe(false);
  });
});
