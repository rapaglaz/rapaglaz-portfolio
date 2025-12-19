import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from '../../services/logger/logger.service';
import { getBrowserLanguage } from './browser-language';

describe('getBrowserLanguage', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    loggerService = TestBed.inject(LoggerService);
  });

  it('defaults to en when navigator is missing (SSR)', () => {
    vi.stubGlobal('navigator', undefined);

    expect(getBrowserLanguage(loggerService)).toBe('en');

    vi.unstubAllGlobals();
  });

  it('returns lowercase browser language', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(getBrowserLanguage(loggerService)).toBe('en-us');

    vi.stubGlobal('navigator', { language: 'DE-de' });
    expect(getBrowserLanguage(loggerService)).toBe('de-de');

    vi.unstubAllGlobals();
  });

  it('defaults to en for invalid language values', () => {
    const invalidValues = [null, undefined, 123, '', '  ', {}];

    invalidValues.forEach(value => {
      vi.stubGlobal('navigator', { language: value });
      expect(getBrowserLanguage(loggerService)).toBe('en');
    });

    vi.unstubAllGlobals();
  });

  it('logs warning in dev mode for invalid language', () => {
    vi.stubGlobal('ngDevMode', true);
    const warnSpy = vi.spyOn(loggerService, 'warn');
    vi.stubGlobal('navigator', { language: 123 });

    getBrowserLanguage(loggerService);

    expect(warnSpy).toHaveBeenCalledWith('Invalid browser language format:', 123);

    vi.unstubAllGlobals();
  });

  it('skips logging in production', () => {
    vi.stubGlobal('ngDevMode', false);
    const warnSpy = vi.spyOn(loggerService, 'warn');
    vi.stubGlobal('navigator', { language: null });

    getBrowserLanguage(loggerService);

    expect(warnSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
