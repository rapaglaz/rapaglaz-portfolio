import { Component, computed, viewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CERTIFICATIONS, type Certification } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';
import { injectActiveLang } from '../../utils/i18n';

type CertificationWithFormattedDate = Certification & {
  formattedDate: string;
};

@Component({
  selector: 'app-certifications',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './certifications.html',
})
export class Certifications {
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
    return CERTIFICATIONS.map(cert => ({
      ...cert,
      formattedDate: this.formatDate(cert.date, formatter),
    }));
  });

  protected readonly getCertDelay = buildDelayGetter('certifications');

  private formatDate(isoDate: string, formatter: Intl.DateTimeFormat): string {
    const parts = isoDate.split('-');
    const year = parseInt(parts[0] ?? '', 10);
    const month = parseInt(parts[1] ?? '', 10);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return isoDate;
    }
    return formatter.format(new Date(year, month - 1, 1));
  }
}
