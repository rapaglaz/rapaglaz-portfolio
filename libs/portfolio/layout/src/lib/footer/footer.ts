import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CONTACT_LINKS, injectContactEmailOpener } from '@rapaglaz/portfolio/util';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslocoModule],
  // block and not the default inline: Safari 27 adds space below an inline host with block content
  host: { class: 'block' },
})
export class Footer {
  protected readonly links = CONTACT_LINKS;
  protected readonly currentYear = new Date().getFullYear();
  protected readonly contactEmail = injectContactEmailOpener();
}
