import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CONTACT_ITEMS } from '../../content/contact.content';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly currentYear = computed(() => new Date().getFullYear());

  protected contactEmail(): void {
    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');

    if (!emailItem?.href) return;
    if (!isPlatformBrowser(this.platformId)) return;

    const win = this.document.defaultView;
    win?.location.assign(emailItem.href);
  }
}
