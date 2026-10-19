import { Component } from '@angular/core';
import { Portfolio } from '@rapaglaz/portfolio/layout';

@Component({
  selector: 'app-root',
  imports: [Portfolio],
  template: `<app-portfolio />`,
})
export class App {}
