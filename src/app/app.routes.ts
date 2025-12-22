import type { Type } from '@angular/core';
import { Routes } from '@angular/router';
import type { Portfolio } from './portfolio/portfolio';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './utils/i18n';

const portfolioRoute = (): Promise<Type<Portfolio>> =>
  import('./portfolio/portfolio').then(m => m.Portfolio);

export const routes: Routes = [
  {
    path: '',
    loadComponent: portfolioRoute,
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: portfolioRoute,
  })),
  {
    path: '**',
    redirectTo: DEFAULT_LANG,
  },
];
