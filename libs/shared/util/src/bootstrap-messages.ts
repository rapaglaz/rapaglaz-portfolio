import type { AvailableLang } from './lib/i18n/languages/languages';
import { common as de } from './lib/i18n/translations/de.json';
import { common as en } from './lib/i18n/translations/en.json';

/** t(common.bootstrapError) */
export const BOOTSTRAP_ERRORS: Readonly<Record<AvailableLang, string>> = {
  en: en.bootstrapError,
  de: de.bootstrapError,
};
