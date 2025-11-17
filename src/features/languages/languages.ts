import { ChangeDetectionStrategy, Component, computed, viewChild } from '@angular/core';
import { translateObjectSignal, TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-languages',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './languages.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Languages {
  protected readonly sectionWrapper = viewChild(SectionWrapper);

  protected readonly languagesData = translateObjectSignal('portfolio.languages.items');

  protected readonly languages = computed(() => {
    const items = this.languagesData();
    return Object.entries(items).map(([key, value]) => ({
      key,
      name: value.name,
      level: value.level,
    }));
  });

  protected readonly getLanguageDelay = buildDelayGetter('languages');
}
