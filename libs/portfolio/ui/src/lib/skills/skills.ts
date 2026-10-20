import { Component, computed, input, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildStaggerDelay } from '@rapaglaz/shared/util';

export type SkillCategoryId =
  'frontend' | 'testing' | 'devops' | 'architecture' | 'backend' | 'soft-skills' | 'familiar';

export type Skill = {
  readonly id: string;
};

export type SkillCategory = {
  readonly id: SkillCategoryId;
  readonly skills: readonly Skill[];
};

// Skills without production experience; shown in a separate, labelled group.
const SECONDARY_CATEGORY: SkillCategoryId = 'familiar';

type SkillBadge = { readonly categoryId: SkillCategoryId; readonly skillId: string };

const toBadges = (categories: readonly SkillCategory[]): SkillBadge[] =>
  categories.flatMap(category =>
    category.skills.map(skill => ({
      categoryId: category.id,
      skillId: skill.id,
    })),
  );

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
      <div
        class="animate-container flex flex-wrap gap-3"
        [class.visible]="wrapper.scrollReveal.isVisible()">
        @for (skill of allSkills(); track skill.skillId; let i = $index) {
          <span
            data-testid="skill-badge"
            class="card-ocean text-base-content animate-pill cursor-default px-4 py-2 text-sm font-medium"
            [class.visible]="wrapper.scrollReveal.isVisible()"
            [style.animation-delay]="getSkillDelay(i)">
            {{ 'portfolio.skills.items.' + skill.skillId | transloco }}
          </span>
        }
      </div>

      @if (secondarySkills().length) {
        <p
          data-testid="skills-secondary-title"
          class="mt-6 mb-3 text-sm text-(--color-text-subtle)">
          {{ 'portfolio.skills.categoryTitles.' + secondaryCategory | transloco }}
        </p>
        <div
          class="animate-container flex flex-wrap gap-3"
          [class.visible]="wrapper.scrollReveal.isVisible()">
          @for (skill of secondarySkills(); track skill.skillId; let i = $index) {
            <span
              data-testid="skill-badge-secondary"
              class="card-ocean text-base-content/80 animate-pill cursor-default px-4 py-2 text-sm"
              [class.visible]="wrapper.scrollReveal.isVisible()"
              [style.animation-delay]="getSkillDelay(allSkills().length + i)">
              {{ 'portfolio.skills.items.' + skill.skillId | transloco }}
            </span>
          }
        </div>
      }
    </app-section-wrapper>
  `,
})
export class Skills {
  readonly categories = input.required<readonly SkillCategory[]>();

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

  protected readonly secondaryCategory = SECONDARY_CATEGORY;

  protected readonly allSkills = computed(() =>
    toBadges(this.categories().filter(category => category.id !== SECONDARY_CATEGORY)),
  );

  protected readonly secondarySkills = computed(() =>
    toBadges(this.categories().filter(category => category.id === SECONDARY_CATEGORY)),
  );

  protected readonly getSkillDelay = buildStaggerDelay({ base: 0.15, increment: 0.015 });
}
