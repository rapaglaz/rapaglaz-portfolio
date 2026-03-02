import { DOCUMENT } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ApplicationRef,
  EnvironmentProviders,
  inject,
  InjectionToken,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  bootstrapApplication,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  provideTransloco,
  TRANSLOCO_MISSING_HANDLER,
  translocoConfig,
  TranslocoService,
} from '@jsverse/transloco';
import { catchError, EMPTY, Observable } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { turnstileInterceptor } from './interceptors';
import {
  AVAILABLE_LANGS,
  type AvailableLang,
  DEFAULT_LANG,
  isAvailableLang,
  StrictTranslocoMissingHandler,
  TranslocoHttpLoader,
} from './utils/i18n';

const DEFAULT_LANG_TOKEN = new InjectionToken<string>('DEFAULT_LANG');

export function provideTranslocoWithDynamicLang(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DEFAULT_LANG_TOKEN,
      deps: [DOCUMENT],
      useFactory: (document: Document): AvailableLang => {
        let pathname = document.location?.pathname ?? '';
        if (!pathname) {
          try {
            pathname = new URL(document.baseURI).pathname;
          } catch {
            pathname = '';
          }
        }
        const segment = pathname.split('/').filter(Boolean)[0] ?? '';
        return isAvailableLang(segment) ? segment : DEFAULT_LANG;
      },
    },
    provideTransloco({
      config: translocoConfig({
        availableLangs: [...AVAILABLE_LANGS],
        defaultLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: false, allowEmpty: false },
      }),
      loader: TranslocoHttpLoader,
    }),
    { provide: TRANSLOCO_MISSING_HANDLER, useClass: StrictTranslocoMissingHandler },
    provideAppInitializer(initTranslocoDefaultLang),
  ]);
}

export function initTranslocoDefaultLang(): Observable<unknown> {
  const transloco = inject(TranslocoService);
  const document = inject(DOCUMENT);
  const defaultLang = inject(DEFAULT_LANG_TOKEN);
  transloco.setActiveLang(defaultLang);
  document.documentElement.lang = defaultLang;
  return transloco.load(defaultLang).pipe(
    catchError(() => {
      if (defaultLang !== DEFAULT_LANG) {
        transloco.setActiveLang(DEFAULT_LANG);
        document.documentElement.lang = DEFAULT_LANG;
        return transloco.load(DEFAULT_LANG);
      }
      return EMPTY;
    }),
  );
}

const baseProviders = [
  provideBrowserGlobalErrorListeners(),
  ...(isDevMode() ? [] : [provideClientHydration(withEventReplay())]),
  provideHttpClient(withInterceptors([turnstileInterceptor])),
  provideTranslocoWithDynamicLang(),
];

export const appConfigBase: ApplicationConfig = {
  providers: baseProviders,
};

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), ...baseProviders],
};

export function bootstrap(): Promise<ApplicationRef> {
  return bootstrapApplication(App, appConfig).catch(err => {
    console.error('[ERROR] Bootstrap failed:', err);
    const errorEl = document.createElement('div');
    errorEl.style.cssText =
      'display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:1rem';
    errorEl.textContent = 'Failed to load the application. Please refresh the page.';
    document.body.replaceChildren(errorEl);
    throw err;
  });
}
