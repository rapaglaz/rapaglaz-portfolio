export const AVAILABLE_LANGS = ['en', 'de'] as const;
export type AvailableLang = (typeof AVAILABLE_LANGS)[number];

export const DEFAULT_LANG: AvailableLang = 'en';

export const LANG_LABELS: Record<AvailableLang, string> = {
  en: 'English',
  de: 'Deutsch',
};

export function isAvailableLang(lang: string): lang is AvailableLang {
  return (AVAILABLE_LANGS as readonly string[]).includes(lang);
}
