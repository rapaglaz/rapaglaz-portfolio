export type SkillCategoryId =
  'frontend' | 'testing' | 'devops' | 'architecture' | 'backend' | 'soft-skills' | 'familiar';

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
      { id: 'storybook' },
    ],
  },
  {
    id: 'devops',
    skills: [{ id: 'github-actions' }, { id: 'git' }, { id: 'docker' }],
  },
  {
    id: 'architecture',
    skills: [
      { id: 'microfrontends' },
      { id: 'module-federation' },
      { id: 'state-management' },
      { id: 'design-systems' },
      { id: 'performance' },
      { id: 'scalable' },
    ],
  },
  {
    id: 'backend',
    skills: [{ id: 'nodejs' }, { id: 'rest-api' }],
  },
  {
    id: 'soft-skills',
    skills: [{ id: 'agile' }, { id: 'mentoring' }],
  },
  {
    // Rendered separately with its own label: no production experience, so not mixed into core skills.
    id: 'familiar',
    skills: [{ id: 'react' }, { id: 'vue' }],
  },
] as const;
