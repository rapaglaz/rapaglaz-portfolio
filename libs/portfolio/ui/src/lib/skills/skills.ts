import { Component, computed, input, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildStaggerDelay } from '@rapaglaz/shared/util';

export type SkillCategoryId =
  'frontend' | 'testing' | 'devops' | 'architecture' | 'backend' | 'soft-skills' | 'familiar';

export type Skill = {
  readonly id: string;
  // Core stack: rendered as a filled, accent-tinted badge.
  readonly core?: boolean;
};

export type SkillCategory = {
  readonly id: SkillCategoryId;
  readonly skills: readonly Skill[];
};

// Skills without production experience; shown in a separate, labelled group.
const SECONDARY_CATEGORY: SkillCategoryId = 'familiar';

// A single [class] binding carries the whole list, because a static class next to it trips lint.
const BADGE_BASE_CLASS = 'animate-pill cursor-default rounded-lg border px-3 py-1.5 text-sm';

type SkillBadge = {
  readonly id: string;
  readonly core: boolean;
  // Position over all badges, so that the stagger delay runs through the groups.
  readonly index: number;
};

type SkillGroup = {
  readonly categoryId: SkillCategoryId;
  readonly skills: readonly SkillBadge[];
};

const toGroups = (categories: readonly SkillCategory[], startIndex = 0): SkillGroup[] => {
  let index = startIndex;
  return categories.map(category => ({
    categoryId: category.id,
    skills: category.skills.map(skill => ({
      id: skill.id,
      core: skill.core === true,
      index: index++,
    })),
  }));
};

// section-wrapper translates titleKey; listed for i18n:check
/** t(portfolio.skills.title) */
@Component({
  selector: 'app-skills',
  imports: [TranslocoModule, SectionWrapper],

  template: `
    <app-section-wrapper
      sectionId="skills"
      titleKey="portfolio.skills.title">
      @let wrapper = sectionWrapper();
      <div class="space-y-6">
        @for (group of groups(); track group.categoryId) {
          <div data-testid="skill-group">
            <h3
              class="mb-2 text-sm font-semibold text-(--color-text-muted)"
              data-testid="skill-group-title">
              {{ 'portfolio.skills.categoryTitles.' + group.categoryId | transloco }}
            </h3>
            <div
              class="animate-container flex flex-wrap gap-2"
              [class.visible]="wrapper.scrollReveal.isVisible()">
              @for (skill of group.skills; track skill.id) {
                <span
                  data-testid="skill-badge"
                  [class]="skill.core ? coreBadgeClass : plainBadgeClass"
                  [class.visible]="wrapper.scrollReveal.isVisible()"
                  [style.animation-delay]="getSkillDelay(skill.index)">
                  {{ 'portfolio.skills.items.' + skill.id | transloco }}
                </span>
              }
            </div>
          </div>
        }

        @if (secondaryGroup(); as secondary) {
          <div class="pt-2">
            <p
              data-testid="skills-secondary-title"
              class="mb-2 text-sm text-(--color-text-subtle)">
              {{ 'portfolio.skills.categoryTitles.' + secondary.categoryId | transloco }}
            </p>
            <div
              class="animate-container flex flex-wrap gap-2"
              [class.visible]="wrapper.scrollReveal.isVisible()">
              @for (skill of secondary.skills; track skill.id) {
                <span
                  data-testid="skill-badge-secondary"
                  class="animate-pill border-base-content/20 text-base-content/75 cursor-default rounded-lg border border-dashed px-3 py-1.5 text-sm"
                  [class.visible]="wrapper.scrollReveal.isVisible()"
                  [style.animation-delay]="getSkillDelay(skill.index)">
                  {{ 'portfolio.skills.items.' + skill.id | transloco }}
                </span>
              }
            </div>
          </div>
        }
      </div>
    </app-section-wrapper>
  `,
})
export class Skills {
  readonly categories = input.required<readonly SkillCategory[]>();

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

  protected readonly coreBadgeClass = `${BADGE_BASE_CLASS} border-primary/43 bg-primary/11 text-base-content/90 font-semibold dark:border-primary/38 dark:bg-primary/13`;
  protected readonly plainBadgeClass = `${BADGE_BASE_CLASS} border-base-content/25 text-base-content/90 font-medium`;

  protected readonly groups = computed(() =>
    toGroups(this.categories().filter(category => category.id !== SECONDARY_CATEGORY)),
  );

  protected readonly secondaryGroup = computed(() => {
    const [group] = toGroups(
      this.categories().filter(category => category.id === SECONDARY_CATEGORY),
      this.groups().reduce((count, { skills }) => count + skills.length, 0),
    );
    return group?.skills.length ? group : null;
  });

  protected readonly getSkillDelay = buildStaggerDelay({ base: 0.15, increment: 0.015 });
}
