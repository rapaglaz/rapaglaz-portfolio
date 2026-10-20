import { Component, computed, input, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SectionWrapper } from '@rapaglaz/shared/ui';
import { buildStaggerDelay, injectActiveLang } from '@rapaglaz/shared/util';

export type CertificationId = 'angular-architecture' | 'angular-testing' | 'angular-spa-typescript';

export type Certification = {
  readonly id: CertificationId;
  readonly date: string;
  readonly durationDays: number;
  readonly remote: boolean;
};

type CertificationWithFormattedDate = Certification & {
  formattedDate: string;
};

@Component({
  selector: 'app-certifications',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './certifications.html',
})
export class Certifications {
  readonly items = input.required<readonly Certification[]>();

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

  private readonly activeLang = injectActiveLang();

  private readonly dateFormatter = computed(() => {
    const locale = this.activeLang();
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
    });
  });

  protected readonly certifications = computed<CertificationWithFormattedDate[]>(() => {
    const formatter = this.dateFormatter();
    return this.items().map(cert => ({
      ...cert,
      formattedDate: this.formatDate(cert.date, formatter),
    }));
  });

  protected readonly getCertDelay = buildStaggerDelay({ base: 0, increment: 0.075 });

  private formatDate(isoDate: string, formatter: Intl.DateTimeFormat): string {
    const parts = isoDate.split('-');
    const year = Number.parseInt(parts[0] ?? '', 10);
    const month = Number.parseInt(parts[1] ?? '', 10);
    if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
      return isoDate;
    }
    return formatter.format(new Date(year, month - 1, 1));
  }
}
