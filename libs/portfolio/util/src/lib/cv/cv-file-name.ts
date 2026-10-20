import type { AvailableLang } from '@rapaglaz/shared/util';

// One PDF per language in the R2 bucket; the downloaded file keeps this name
export function cvFileName(lang: AvailableLang): string {
  return `Radoslaw_Pawel_Glaz_CV-${lang.toUpperCase()}.pdf`;
}
