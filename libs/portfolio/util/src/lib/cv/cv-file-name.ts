import type { AvailableLang } from '@rapaglaz/shared/util';

export function cvFileName(lang: AvailableLang): string {
  return `Radoslaw_Pawel_Glaz_CV-${lang.toUpperCase()}.pdf`;
}
