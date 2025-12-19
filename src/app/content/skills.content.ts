export type SkillCategoryId =
  | 'frontend'
  | 'testing'
  | 'devops'
  | 'architecture'
  | 'backend'
  | 'soft-skills';

export type Skill = {
  readonly id: string;
};

export type SkillCategory = {
  readonly id: SkillCategoryId;
  readonly skills: readonly Skill[];
};

export const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    id: 'frontend',
    skills: [
      { id: 'angular' },
      { id: 'typescript' },
      { id: 'rxjs' },
      { id: 'nx' },
      { id: 'javascript' },
      { id: 'tailwind' },
      { id: 'html-css' },
      { id: 'signals' },
    ],
  },
  {
    id: 'testing',
    skills: [
      { id: 'e2e' },
      { id: 'unit' },
      { id: 'playwright' },
      { id: 'vitest' },
      { id: 'jest' },
      { id: 'cypress' },
    ],
  },
  {
    id: 'devops',
    skills: [{ id: 'github-actions' }, { id: 'git' }],
  },
  {
    id: 'architecture',
    skills: [{ id: 'microfrontends' }, { id: 'performance' }, { id: 'scalable' }],
  },
  {
    id: 'backend',
    skills: [{ id: 'rest-api' }],
  },
  {
    id: 'soft-skills',
    skills: [{ id: 'agile' }, { id: 'mentoring' }],
  },
] as const;
