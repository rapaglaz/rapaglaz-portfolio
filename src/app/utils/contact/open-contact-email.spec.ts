import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { mockWindowLocation } from '../../testing';
import { injectContactEmailOpener } from './open-contact-email';

describe('injectContactEmailOpener', () => {
  let restoreLocation: (() => void) | undefined;

  afterEach(() => {
    restoreLocation?.();
    restoreLocation = undefined;
  });

  it('opens the configured email address in the browser', () => {
    const { assignMock, cleanup } = mockWindowLocation();
    restoreLocation = cleanup;
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });
    const openEmail = TestBed.runInInjectionContext(injectContactEmailOpener);

    openEmail();

    expect(assignMock).toHaveBeenCalledExactlyOnceWith('mailto:paul@rapaglaz.de');
  });

  it('does not navigate during server rendering', () => {
    const { assignMock, cleanup } = mockWindowLocation();
    restoreLocation = cleanup;
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const openEmail = TestBed.runInInjectionContext(injectContactEmailOpener);

    openEmail();

    expect(assignMock).not.toHaveBeenCalled();
  });

  it('can be called when the document has no window', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: { defaultView: null } },
      ],
    });
    const openEmail = TestBed.runInInjectionContext(injectContactEmailOpener);

    expect(() => openEmail()).not.toThrow();
  });
});
