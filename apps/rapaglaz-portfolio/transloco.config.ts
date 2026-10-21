import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';

const AVAILABLE_LANGS = ['en', 'de'] as const;

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'libs/shared/util/src/lib/i18n/translations/',
  langs: [...AVAILABLE_LANGS],
  keysManager: {
    input: ['apps/rapaglaz-portfolio/src', 'libs'],
    // Keys built at runtime are listed in t(...) comments next to their use
    emitErrorOnExtraKeys: true,
  },
};

export default config;
