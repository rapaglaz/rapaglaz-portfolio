import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationError,
  provideRouter,
  RedirectCommand,
  Router,
  withNavigationErrorHandler,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LoggerService } from '@rapaglaz/shared/util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleNavigationError } from './navigation-error';

@Component({ template: 'error page' })
class ErrorStandIn {}

describe('handleNavigationError', () => {
  const logError = vi.fn();

  beforeEach(() => {
    logError.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LoggerService, useValue: { error: logError } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('sends the visitor to /error without changing the address', () => {
    const failure = new Error('chunk is gone');

    const result = TestBed.runInInjectionContext(() =>
      handleNavigationError(new NavigationError(1, '/en', failure)),
    );

    expect(result).toBeInstanceOf(RedirectCommand);
    expect(TestBed.inject(Router).serializeUrl((result as RedirectCommand).redirectTo)).toBe(
      '/error',
    );
    expect((result as RedirectCommand).navigationBehaviorOptions).toEqual({
      skipLocationChange: true,
    });
    expect(logError).toHaveBeenCalledWith('Navigation to /en failed', failure);
  });

  it('logs the path without the query string and the fragment', () => {
    TestBed.runInInjectionContext(() =>
      handleNavigationError(new NavigationError(1, '/en?token=secret#skills', new Error('x'))),
    );

    expect(logError).toHaveBeenCalledWith('Navigation to /en failed', expect.any(Error));
  });

  it('does not start a loop when the error page itself fails', () => {
    const result = TestBed.runInInjectionContext(() =>
      handleNavigationError(new NavigationError(1, '/error', new Error('x'))),
    );

    expect(result).toBeUndefined();
    expect(logError).not.toHaveBeenCalled();
  });

  it('turns a lazy route that cannot load into the error page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'error', component: ErrorStandIn },
            {
              path: 'page',
              loadComponent: (): Promise<never> =>
                Promise.reject(new Error('Loading chunk failed')),
            },
          ],
          withNavigationErrorHandler(handleNavigationError),
        ),
        { provide: LoggerService, useValue: { error: logError } },
      ],
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/page');

    expect(harness.routeNativeElement?.textContent).toContain('error page');
    expect(logError).toHaveBeenCalledOnce();
  });
});
