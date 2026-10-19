import { describe, expect, it } from 'vitest';
import { isAvailableLang } from './languages';

describe('isAvailableLang', () => {
  it.each([
    ['en', true],
    ['de', true],
    ['fr', false],
    ['', false],
  ])('returns %s → %s', (lang, expected) => {
    expect(isAvailableLang(lang)).toBe(expected);
  });
});
