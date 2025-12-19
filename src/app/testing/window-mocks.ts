import { vi } from 'vitest';

export function mockWindowLocation(): {
  assignMock: ReturnType<typeof vi.fn>;
  cleanup: () => void;
} {
  const originalLocation = window.location;
  const assignMock = vi.fn();

  Object.defineProperty(window, 'location', {
    value: { assign: assignMock },
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

  return { assignMock, cleanup };
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
    }
  };
}
