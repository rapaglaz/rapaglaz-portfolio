import { TranslocoGlobalConfig } from '@jsverse/transloco-utils';
const AVAILABLE_LANGS = ['en', 'de'] as const;

const config: TranslocoGlobalConfig = {
  rootTranslationsPath: 'public/i18n/',
  langs: [...AVAILABLE_LANGS],
  keysManager: {
    input: ['src'],
    emitErrorOnExtraKeys: false,
  },
};

export default config;
