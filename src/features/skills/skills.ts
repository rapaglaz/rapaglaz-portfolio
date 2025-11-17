import { ChangeDetectionStrategy, Component, computed, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SKILL_CATEGORIES } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-skills',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './skills.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skills {
  protected readonly sectionWrapper = viewChild(SectionWrapper);

  protected readonly allSkills = computed(() =>
    SKILL_CATEGORIES.flatMap(category =>
      category.skills.map(skill => ({
        categoryId: category.id,
        skillId: skill.id,
      })),
    ),
  );

  protected readonly getSkillDelay = buildDelayGetter('skills');
}
