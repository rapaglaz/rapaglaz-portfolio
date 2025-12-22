import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CONTACT_ITEMS, type ContactItem } from '../../content';
import { SectionWrapper } from '../../ui';
import { buildDelayGetter } from '../../utils/animation';

@Component({
  selector: 'app-contact',
  imports: [TranslocoModule, SectionWrapper],
  templateUrl: './contact.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly translocoService = inject(TranslocoService);
  private readonly currentLang = toSignal(this.translocoService.langChanges$, {
    initialValue: this.translocoService.getActiveLang(),
  });

  protected readonly sectionWrapper = viewChild.required(SectionWrapper);
  protected readonly contactItems: readonly ContactItem[] = CONTACT_ITEMS;
  protected readonly getContactDelay = buildDelayGetter('contact');

  protected getContactTarget(contact: ContactItem): string | null {
    return contact.isExternal ? '_blank' : null;
  }

  protected getContactRel(contact: ContactItem): string | null {
    return contact.isExternal ? 'noopener noreferrer' : null;
  }

  protected getContactAriaLabel(contact: ContactItem): string {
    this.currentLang();
    const label = this.translocoService.translate(`portfolio.contact.labels.${contact.id}`);
    const baseLabel = `${label}: ${contact.value}`;
    if (!contact.isExternal) {
      return baseLabel;
    }
    const newTabLabel = this.translocoService.translate('common.a11y.opensInNewTab');
    return `${baseLabel} (${newTabLabel})`;
  }
}
