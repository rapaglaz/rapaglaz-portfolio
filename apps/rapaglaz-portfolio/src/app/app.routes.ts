import { DOCUMENT } from '@angular/common';
import { inject, Type } from '@angular/core';
import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ErrorPage } from '@rapaglaz/portfolio/layout';
import {
  AVAILABLE_LANGS,
  DEFAULT_LANG,
  isAvailableLang,
  LoggerService,
  type AvailableLang,
} from '@rapaglaz/shared/util';
import { catchError, EMPTY, map, of, tap } from 'rxjs';
import { ERROR_PATH } from './navigation-error';

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

// A static import of the library, even of its type, would fail the Nx lazy-load lint rule
const loadPortfolio = (): Promise<Type<unknown>> =>
  import('@rapaglaz/portfolio/feature').then(m => m.PortfolioPage);

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
  // the navigation error handler lands here, see navigation-error.ts
  {
    path: ERROR_PATH,
    component: ErrorPage,
    data: { kind: 'failed', hideNavbar: true },
  },
  {
    path: '**',
    component: ErrorPage,
    data: { kind: 'notFound', hideNavbar: true },
  },
];
