import { signal, Signal } from '@angular/core';

export type ScrollRevealState = {
  readonly isVisible: Signal<boolean>;
  readonly onVisibilityChange: (isVisible: boolean) => void;
};

export function createScrollRevealState(): ScrollRevealState {
  const isVisible = signal(false);

  return {
    isVisible: isVisible.asReadonly(),
    onVisibilityChange: (visible: boolean): void => {
      if (visible) {
        isVisible.set(true);
      }
    },
  };
}
