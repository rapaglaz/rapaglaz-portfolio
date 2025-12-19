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
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import {
  provideTransloco,
  TRANSLOCO_MISSING_HANDLER,
  translocoConfig,
  TranslocoService,
} from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { proxyInterceptor, turnstileInterceptor } from './interceptors';
import { LoggerService } from './services';
import {
  AVAILABLE_LANGS,
  DEFAULT_LANG,
  getBrowserLanguage,
  isAvailableLang,
  StrictTranslocoMissingHandler,
  TranslocoHttpLoader,
} from './utils/i18n';

const DEFAULT_LANG_TOKEN = new InjectionToken<string>('DEFAULT_LANG');

export function provideTranslocoWithDynamicLang(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DEFAULT_LANG_TOKEN,
      deps: [LoggerService],
      useFactory: (logger: LoggerService): string => {
        const browserLang = getBrowserLanguage(logger).split('-')[0];
        return isAvailableLang(browserLang) ? browserLang : DEFAULT_LANG;
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
  const defaultLang = inject(DEFAULT_LANG_TOKEN);
  transloco.setActiveLang(defaultLang);
  return transloco.load(defaultLang);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideClientHydration(),
    provideHttpClient(withInterceptors([proxyInterceptor, turnstileInterceptor])),
    provideTranslocoWithDynamicLang(),
  ],
};

export function bootstrap(): Promise<ApplicationRef> {
  return bootstrapApplication(App, appConfig).catch(err => {
    console.error('[ERROR] Bootstrap failed:', err);
    throw err;
  });
}
