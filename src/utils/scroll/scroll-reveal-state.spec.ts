import { describe, expect, it } from 'vitest';
import { createScrollRevealState } from './scroll-reveal-state';

describe('createScrollRevealState', () => {
  it('reveals once and stays visible', () => {
    const state = createScrollRevealState();

    expect(state.isVisible()).toBe(false);

    state.onVisibilityChange(true);
    expect(state.isVisible()).toBe(true);

    state.onVisibilityChange(false);
    expect(state.isVisible()).toBe(true);
  });
});
