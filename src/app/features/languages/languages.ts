import { ChangeDetectionStrategy, Component, computed, viewChild } from '@angular/core';
import { translateObjectSignal, TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-languages',
  imports: [TranslocoModule, SectionWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-wrapper
      sectionId="languages"
      titleKey="portfolio.languages.title">
      @let wrapper = sectionWrapper();
      <div
        class="animate-container grid grid-cols-1 gap-6 sm:grid-cols-3"
        [class.visible]="wrapper.scrollReveal.isVisible()">
        @for (language of languages(); track language.key; let i = $index) {
          <div
            data-testid="language-card"
            class="card-ocean animate-item px-6 py-4"
            [class.visible]="wrapper.scrollReveal.isVisible()"
            [style.animation-delay]="getLanguageDelay(i)">
            <h3 class="text-base-content mb-1 text-xl font-bold">
              {{ language.name }}
            </h3>
            <p class="text-sm text-(--color-text-subtle)">
              {{ language.level }}
            </p>
          </div>
        }
      </div>
    </app-section-wrapper>
  `,
})
export class Languages {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

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
