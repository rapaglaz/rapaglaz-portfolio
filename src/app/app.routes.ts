import { DOCUMENT } from '@angular/common';
import { inject, Type } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, EMPTY, map, of, tap } from 'rxjs';
import { Portfolio } from './portfolio/portfolio';
import { LoggerService } from './services/logger/logger.service';
import { AVAILABLE_LANGS, type AvailableLang, DEFAULT_LANG, isAvailableLang } from './utils/i18n';

const resolvePortfolioLocale: ResolveFn<AvailableLang> = route => {
  const transloco = inject(TranslocoService);
  const document = inject(DOCUMENT);
  const router = inject(Router);
  const logger = inject(LoggerService);
  const path = route.routeConfig?.path ?? '';
  const lang = isAvailableLang(path) ? path : DEFAULT_LANG;

  return transloco.load(lang).pipe(
    tap(() => {
      transloco.setActiveLang(lang);
      document.documentElement.lang = lang;
    }),
    map(() => lang),
    catchError(() => {
      logger.warn(`Could not load translations for ${lang}.`);
      if (lang === DEFAULT_LANG) {
        return EMPTY;
      }
      return of(
        new RedirectCommand(
          router.createUrlTree(['/', DEFAULT_LANG], {
            queryParams: route.queryParams,
            fragment: route.fragment ?? undefined,
          }),
          { replaceUrl: true },
        ),
      );
    }),
  );
};

const loadPortfolio = (): Promise<Type<Portfolio>> =>
  import('./portfolio/portfolio').then(m => m.Portfolio);

export const routes: Routes = [
  {
    path: '',
    loadComponent: loadPortfolio,
    resolve: { locale: resolvePortfolioLocale },
  },
  ...AVAILABLE_LANGS.map(lang => ({
    path: lang,
    loadComponent: loadPortfolio,
    resolve: { locale: resolvePortfolioLocale },
  })),
  {
    path: '**',
    redirectTo: '',
  },
];
