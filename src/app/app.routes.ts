import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { Portfolio } from './portfolio/portfolio';
import { AVAILABLE_LANGS } from './utils/i18n';

const loadPortfolio = (): Promise<Type<Portfolio>> =>
  import('./portfolio/portfolio').then(m => m.Portfolio);

export const routes: Routes = [
  {
    path: '',
    loadComponent: loadPortfolio,
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: loadPortfolio,
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
