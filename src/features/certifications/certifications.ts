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
  private readonly transloco = inject(TranslocoService);
  protected readonly sectionWrapper = viewChild(SectionWrapper);

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

  protected readonly certificationCount = computed(() => this.certifications().length);

  protected getCertClasses(): string {
    const baseClasses =
      'card-ocean px-4 py-4 rounded-md lg:bg-transparent lg:border-0 lg:border-l-2 lg:border-primary/30 lg:pl-6 transition-colors animate-cert';
    return `${baseClasses}`;
  }

  protected readonly getCertDelay = buildDelayGetter('certifications');

  private formatDate(isoDate: string, formatter: Intl.DateTimeFormat): string {
    const [year, month] = isoDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return formatter.format(date);
  }
}
