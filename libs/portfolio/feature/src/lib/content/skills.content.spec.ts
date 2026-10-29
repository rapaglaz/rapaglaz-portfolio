import { describe, expect, it } from 'vitest';
import { SKILL_CATEGORIES } from './skills.content';

// Chosen for what recruiters and technical interviewers look for in senior Angular roles, not for the CV.
// Nx and Tailwind CSS are kept on purpose as the maintainer's own stack.
const CORE_SKILL_IDS = [
  'angular',
  'typescript',
  'rxjs',
  'nx',
  'tailwind',
  'signals',
  'state-management',
  'jest',
  'playwright',
  'cypress',
  'github-actions',
];

describe('SKILL_CATEGORIES', () => {
  it('marks the intended skills as core', () => {
    const core = SKILL_CATEGORIES.flatMap(category => category.skills)
      .filter(skill => skill.core)
      .map(skill => skill.id);

    expect(core).toEqual(expect.arrayContaining(CORE_SKILL_IDS));
    expect(core).toHaveLength(CORE_SKILL_IDS.length);
  });

  it('keeps the familiar category free of core skills', () => {
    const familiar = SKILL_CATEGORIES.find(category => category.id === 'familiar');

    expect(familiar?.skills.some(skill => skill.core)).toBe(false);
  });
});
