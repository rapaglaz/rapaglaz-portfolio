import { describe, expect, it } from 'vitest';
import { buildStaggerDelay } from './stagger-delay';

describe('buildStaggerDelay', () => {
  it('staggers the delay of each item by the increment', () => {
    const delay = buildStaggerDelay({ base: 0.15, increment: 0.05 });

    expect([0, 1, 2].map(delay)).toEqual(['0.15s', '0.2s', '0.25s']);
  });

  it('starts without delay when the base is zero', () => {
    expect(buildStaggerDelay({ base: 0, increment: 0.075 })(0)).toBe('0s');
  });

  it('rounds to hundredths of a second', () => {
    expect(buildStaggerDelay({ base: 0.15, increment: 0.015 })(3)).toBe('0.2s');
  });
});
