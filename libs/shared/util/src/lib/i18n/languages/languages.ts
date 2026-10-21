export const AVAILABLE_LANGS = ['de', 'en'] as const;
export type AvailableLang = (typeof AVAILABLE_LANGS)[number];

export const DEFAULT_LANG: AvailableLang = 'en';

export const LANG_LABELS: Record<AvailableLang, string> = {
  de: 'Deutsch',
  en: 'English',
};

export function isAvailableLang(lang: string): lang is AvailableLang {
  return (AVAILABLE_LANGS as readonly string[]).includes(lang);
}
