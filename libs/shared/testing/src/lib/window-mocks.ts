import { vi } from 'vitest';

export function mockWindowLocation(pathname = '/'): {
  assignMock: ReturnType<typeof vi.fn>;
  reloadMock: ReturnType<typeof vi.fn>;
  cleanup: () => void;
} {
  const originalLocation = window.location;
  const assignMock = vi.fn();
  const reloadMock = vi.fn();

  Object.defineProperty(window, 'location', {
    value: { assign: assignMock, reload: reloadMock, pathname },
    writable: true,
    configurable: true,
  });

  const cleanup = (): void => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  };

  return { assignMock, reloadMock, cleanup };
}

export function mockWindowScrollY(scrollY: number): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');

  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: scrollY,
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(window, 'scrollY', originalDescriptor);
    } else {
      // scrollY was inherited, so dropping the own property brings the original back
      Reflect.deleteProperty(window, 'scrollY');
    }
  };
}
