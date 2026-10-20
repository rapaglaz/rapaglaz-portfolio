import { describe, expect, it } from 'vitest';
import { cvFileName } from './cv-file-name';

describe('cvFileName', () => {
  it.each([
    ['en', 'Radoslaw_Pawel_Glaz_CV-EN.pdf'],
    ['de', 'Radoslaw_Pawel_Glaz_CV-DE.pdf'],
  ] as const)('names the %s file', (lang, fileName) => {
    expect(cvFileName(lang)).toBe(fileName);
  });
});
