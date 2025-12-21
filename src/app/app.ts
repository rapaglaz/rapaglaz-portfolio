import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer, Navbar } from './features';

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet, Footer],
  template: `
    <app-navbar />
    <router-outlet />
    <app-footer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
