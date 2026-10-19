import type { SkillCategory } from '@rapaglaz/portfolio/ui';

// Templates build portfolio.skills.items.<id> and portfolio.skills.categoryTitles.<category id>.
// transloco-keys-manager cannot see dynamic keys, so i18n:check reads them from this list.
/** t(
  portfolio.skills.items.angular,
  portfolio.skills.items.typescript,
  portfolio.skills.items.rxjs,
  portfolio.skills.items.nx,
  portfolio.skills.items.javascript,
  portfolio.skills.items.tailwind,
  portfolio.skills.items.html-css,
  portfolio.skills.items.signals,
  portfolio.skills.items.playwright,
  portfolio.skills.items.vitest,
  portfolio.skills.items.jest,
  portfolio.skills.items.cypress,
  portfolio.skills.items.storybook,
  portfolio.skills.items.github-actions,
  portfolio.skills.items.git,
  portfolio.skills.items.docker,
  portfolio.skills.items.microfrontends,
  portfolio.skills.items.module-federation,
  portfolio.skills.items.state-management,
  portfolio.skills.items.design-systems,
  portfolio.skills.items.performance,
  portfolio.skills.items.nodejs,
  portfolio.skills.items.rest-api,
  portfolio.skills.items.agile,
  portfolio.skills.items.mentoring,
  portfolio.skills.items.react,
  portfolio.skills.items.vue,
  portfolio.skills.categoryTitles.frontend,
  portfolio.skills.categoryTitles.testing,
  portfolio.skills.categoryTitles.devops,
  portfolio.skills.categoryTitles.architecture,
  portfolio.skills.categoryTitles.backend,
  portfolio.skills.categoryTitles.soft-skills,
  portfolio.skills.categoryTitles.familiar
) */
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
