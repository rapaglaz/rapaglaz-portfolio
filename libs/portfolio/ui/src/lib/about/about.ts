import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';

/** t(portfolio.about.title) */
@Component({
  selector: 'app-about',
  imports: [TranslocoModule, SectionWrapper],
  template: `
    <app-section-wrapper
      sectionId="about"
      titleKey="portfolio.about.title"
      [reveal]="false"
      [divider]="false">
      <p class="text-base-content/90 max-w-[65ch] text-[1.0625rem] leading-[1.6]">
        {{ 'portfolio.about.description' | transloco }}
      </p>
    </app-section-wrapper>
  `,
})
export class About {}
