import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../services/logger/logger.service';
import { StrictTranslocoMissingHandler } from './transloco-missing-handler';

describe('StrictTranslocoMissingHandler', () => {
  let handler: StrictTranslocoMissingHandler;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StrictTranslocoMissingHandler, LoggerService, provideZonelessChangeDetection()],
    });

    handler = TestBed.inject(StrictTranslocoMissingHandler);
    loggerService = TestBed.inject(LoggerService);
  });

  it('logs warning in development mode and returns key as fallback', () => {
    const warnSpy = vi.spyOn(loggerService, 'warn');
    const missingKey = 'missing.translation.key';

    const result = handler.handle(missingKey);

    expect(warnSpy).toHaveBeenCalledWith(`Missing translation key: "${missingKey}"`);
    expect(result).toBe(missingKey);
  });

  it('logs error in production mode and returns key as fallback without crashing', () => {
    // Mock production environment
    vi.stubGlobal('ngDevMode', false);

    const errorSpy = vi.spyOn(loggerService, 'error');
    const warnSpy = vi.spyOn(loggerService, 'warn');
    const missingKey = 'missing.production.key';

    // Should not throw, even in production
    const result = handler.handle(missingKey);

    expect(errorSpy).toHaveBeenCalledWith(`Missing translation key: "${missingKey}"`);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(result).toBe(missingKey);

    // Cleanup
    vi.unstubAllGlobals();
  });

  it('provides graceful degradation by returning the key as user-visible fallback', () => {
    const missingKey = 'hero.title';

    const result = handler.handle(missingKey);

    // User sees the key instead of broken UI or crash
    expect(result).toBe('hero.title');
  });
});
