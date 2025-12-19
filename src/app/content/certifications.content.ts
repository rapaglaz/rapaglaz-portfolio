export type CertificationId = 'angular-architecture' | 'angular-testing' | 'angular-spa-typescript';

export type Certification = {
  readonly id: CertificationId;
  readonly date: string;
  readonly durationDays: number;
  readonly remote: boolean;
};

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
