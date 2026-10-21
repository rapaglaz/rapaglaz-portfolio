import { afterEach, describe, expect, it } from 'vitest';
import { mockWindowLocation, mockWindowScrollY } from './window-mocks';

describe('mockWindowLocation', () => {
  const originalLocation = window.location;

  afterEach(() => {
    expect(window.location).toBe(originalLocation);
  });

  it('records navigation and restores the original location', () => {
    const { assignMock, cleanup } = mockWindowLocation();

    window.location.assign('mailto:test@example.com');

    expect(assignMock).toHaveBeenCalledExactlyOnceWith('mailto:test@example.com');
    expect(window.location).not.toBe(originalLocation);
    cleanup();
  });

  it('records a reload', () => {
    const { reloadMock, cleanup } = mockWindowLocation();

    window.location.reload();

    expect(reloadMock).toHaveBeenCalledOnce();
    cleanup();
  });
});

describe('mockWindowScrollY', () => {
  it('sets the scroll position and restores the original descriptor', () => {
    const originalScrollY = window.scrollY;
    const restore = mockWindowScrollY(240);

    expect(window.scrollY).toBe(240);
    restore();
    expect(window.scrollY).toBe(originalScrollY);
  });

  it('removes the mocked property when window had no own scrollY', () => {
    const ownDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Reflect.deleteProperty(window, 'scrollY');

    try {
      const restore = mockWindowScrollY(240);
      restore();

      expect(Object.getOwnPropertyDescriptor(window, 'scrollY')).toBeUndefined();
    } finally {
      if (ownDescriptor) Object.defineProperty(window, 'scrollY', ownDescriptor);
    }
  });
});
