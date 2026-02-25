import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SKILL_CATEGORIES } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-skills',
  imports: [TranslocoModule, SectionWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-wrapper
      sectionId="skills"
      titleKey="portfolio.skills.title">
      @let wrapper = sectionWrapper();
      <div
        class="animate-container flex flex-wrap gap-3"
        [class.visible]="wrapper.scrollReveal.isVisible()">
        @for (skill of allSkills; track skill.skillId; let i = $index) {
          <span
            data-testid="skill-badge"
            class="card-ocean text-base-content animate-pill cursor-default px-4 py-2 text-sm font-medium"
            [class.visible]="wrapper.scrollReveal.isVisible()"
            [style.animation-delay]="getSkillDelay(i)">
            {{ 'portfolio.skills.items.' + skill.skillId | transloco }}
          </span>
        }
      </div>
    </app-section-wrapper>
  `,
})
export class Skills {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

  protected readonly allSkills = SKILL_CATEGORIES.flatMap(category =>
    category.skills.map(skill => ({
      categoryId: category.id,
      skillId: skill.id,
    })),
  );

  protected readonly getSkillDelay = buildDelayGetter('skills');
}
