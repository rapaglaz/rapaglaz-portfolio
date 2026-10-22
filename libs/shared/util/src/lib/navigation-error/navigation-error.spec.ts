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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../logging/logger.service';
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

  it.each(['/error', '/en/error', '/de/error', '/de/error?from=home'])(
    'does not start a loop when the error page %s itself fails',
    url => {
      const result = TestBed.runInInjectionContext(() =>
        handleNavigationError(new NavigationError(1, url, new Error('x'))),
      );

      expect(result).toBeUndefined();
      expect(logError).not.toHaveBeenCalled();
    },
  );

  it('still handles a page whose name only starts like the error page', () => {
    const result = TestBed.runInInjectionContext(() =>
      handleNavigationError(new NavigationError(1, '/errors', new Error('x'))),
    );

    expect(result).toBeInstanceOf(RedirectCommand);
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
