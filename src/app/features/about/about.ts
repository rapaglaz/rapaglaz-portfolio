import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '../../ui';

@Component({
  selector: 'app-about',
  imports: [TranslocoModule, SectionWrapper],
  template: `
    <app-section-wrapper
      sectionId="about"
      titleKey="portfolio.about.title">
      @let wrapper = sectionWrapper();
      <div
        class="animate-content"
        [class.visible]="wrapper.scrollReveal.isVisible()">
        <p class="text-base-content/90 text-lg leading-relaxed">
          {{ 'portfolio.about.description' | transloco }}
        </p>
      </div>
    </app-section-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
}
