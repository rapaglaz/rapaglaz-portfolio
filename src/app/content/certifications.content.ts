export type CertificationId = 'angular-architecture' | 'angular-testing' | 'angular-spa-typescript';

export type Certification = {
  readonly id: CertificationId;
  readonly date: string;
  readonly durationDays: number;
  readonly remote: boolean;
};

// Templates build portfolio.certifications.items.<id>.title and .issuer; listed for i18n:check.
/** t(
  portfolio.certifications.items.angular-architecture.title,
  portfolio.certifications.items.angular-architecture.issuer,
  portfolio.certifications.items.angular-testing.title,
  portfolio.certifications.items.angular-testing.issuer,
  portfolio.certifications.items.angular-spa-typescript.title,
  portfolio.certifications.items.angular-spa-typescript.issuer
) */
export const CERTIFICATIONS: readonly Certification[] = [
  {
    id: 'angular-architecture',
    date: '2022-12',
    durationDays: 3,
    remote: true,
  },
  {
    id: 'angular-testing',
    date: '2022-03',
    durationDays: 2,
    remote: true,
  },
  {
    id: 'angular-spa-typescript',
    date: '2019-06',
    durationDays: 2,
    remote: false,
  },
] as const;
