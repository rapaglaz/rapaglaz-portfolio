import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);

    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('logs info messages to console', () => {
    service.info('CV downloaded');

    expect(consoleSpy.log).toHaveBeenCalledWith('[INFO] CV downloaded');
  });

  it('logs warnings to console', () => {
    service.warn('Translation key missing');

    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] Translation key missing');
  });

  it('logs errors to console', () => {
    const error = new Error('Network timeout');
    service.error('Network request failed', error);

    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] Network request failed', error);
  });
});
