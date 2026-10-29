import { Component, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';

// section-wrapper translates titleKey; listed for i18n:check
/** t(portfolio.about.title) */
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
        <p class="text-base-content/90 max-w-[65ch] text-[1.0625rem] leading-[1.6]">
          {{ 'portfolio.about.description' | transloco }}
        </p>
      </div>
    </app-section-wrapper>
  `,
})
export class About {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
}
