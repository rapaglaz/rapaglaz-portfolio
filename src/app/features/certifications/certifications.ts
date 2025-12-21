import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CERTIFICATIONS, type Certification } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

type CertificationWithFormattedDate = Certification & {
  formattedDate: string;
};

@Component({
  selector: 'app-certifications',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './certifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Certifications {
  protected readonly sectionWrapper = viewChild.required(SectionWrapper);

  private readonly transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

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
    const [year, month] = isoDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return formatter.format(date);
  }
}
