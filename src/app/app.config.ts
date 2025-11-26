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
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  provideTransloco,
  TRANSLOCO_MISSING_HANDLER,
  translocoConfig,
  TranslocoService,
} from '@jsverse/transloco';
import { proxyInterceptor, turnstileInterceptor } from '../interceptors';
import { LoggerService } from '../services';
import {
  getBrowserLanguage,
  StrictTranslocoMissingHandler,
  TranslocoHttpLoader,
} from '../utils/i18n';
import { App } from './app';
import { routes } from './app.routes';

const AVAILABLE_LANGS = ['en', 'de'];
const DEFAULT_LANG = new InjectionToken<string>('DEFAULT_LANG');

function provideTranslocoWithDynamicLang(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DEFAULT_LANG,
      deps: [LoggerService],
      useFactory: (logger: LoggerService): string[] | string => {
        const browserLang = getBrowserLanguage(logger).split('-')[0];
        return AVAILABLE_LANGS.includes(browserLang) ? browserLang : 'en';
      },
    },
    provideTransloco({
      config: translocoConfig({
        availableLangs: AVAILABLE_LANGS,
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: false, allowEmpty: false },
      }),
      loader: TranslocoHttpLoader,
    }),
    { provide: TRANSLOCO_MISSING_HANDLER, useClass: StrictTranslocoMissingHandler },
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService);
      const defaultLang = inject(DEFAULT_LANG);
      transloco.setActiveLang(defaultLang);
    }),
  ]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
