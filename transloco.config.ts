import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

const AVAILABLE_LANGS = ['en', 'de'] as const;

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'apps/rapaglaz-portfolio/public/i18n/',
  langs: [...AVAILABLE_LANGS],
  keysManager: {
    input: ['apps/rapaglaz-portfolio/src'],
    // Keys built at runtime are listed in t(...) comments next to their use
    emitErrorOnExtraKeys: true,
  },
};

export default config;
