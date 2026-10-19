import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { injectContactEmailOpener } from './open-contact-email';

// The opener navigates through DOCUMENT, so a document stub replaces window.location
function setup(platformId: 'browser' | 'server'): {
  openEmail: () => void;
  assignMock: ReturnType<typeof vi.fn>;
} {
  const assignMock = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      { provide: DOCUMENT, useValue: { defaultView: { location: { assign: assignMock } } } },
    ],
  });
  return { openEmail: TestBed.runInInjectionContext(injectContactEmailOpener), assignMock };
}

describe('injectContactEmailOpener', () => {
  it('opens the configured email address in the browser', () => {
    const { openEmail, assignMock } = setup('browser');

    openEmail();

    expect(assignMock).toHaveBeenCalledExactlyOnceWith('mailto:radek@rapaglaz.de');
  });

  it('does not navigate during server rendering', () => {
    const { openEmail, assignMock } = setup('server');

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
