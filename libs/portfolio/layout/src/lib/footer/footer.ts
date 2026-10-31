import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  imports: [TranslocoModule],
  // block and not the default inline: Safari 27 adds space below an inline host with block content
  host: { class: 'block' },
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();
}
