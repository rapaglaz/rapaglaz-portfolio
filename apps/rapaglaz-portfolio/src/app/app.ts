import { Component } from '@angular/core';
import { Portfolio } from '@rapaglaz/portfolio/layout';

@Component({
  selector: 'app-root',
  imports: [Portfolio],
  // block and not the default inline: Safari 27 adds space below an inline host with block content
  host: { class: 'block' },
  template: `<app-portfolio />`,
})
export class App {}
