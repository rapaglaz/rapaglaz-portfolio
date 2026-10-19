import { describe, expect, it } from 'vitest';
import { buildDelayGetter } from './animation-config';

describe('buildDelayGetter', () => {
  it('staggers the delay of each item by the configured increment', () => {
    const delay = buildDelayGetter('languages');

    expect([0, 1, 2].map(delay)).toEqual(['0.15s', '0.2s', '0.25s']);
  });

  it('starts without delay when the base is zero', () => {
    expect(buildDelayGetter('certifications')(0)).toBe('0s');
  });
});
