export type ContactItemId = 'email' | 'linkedin' | 'github';

export type ContactItem = {
  readonly id: ContactItemId;
  readonly href: string;
  readonly value: string;
  readonly isExternal: boolean;
};

export const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    id: 'email',
    href: 'mailto:paul@rapaglaz.de',
    value: 'paul@rapaglaz.de',
    isExternal: false,
  },
  {
    id: 'linkedin',
    href: 'https://www.linkedin.com/in/paul-glaz/',
    value: 'linkedin.com/in/paul-glaz',
    isExternal: true,
  },
  {
    id: 'github',
    href: 'https://github.com/rapaglaz',
    value: 'github.com/rapaglaz',
    isExternal: true,
  },
] as const;
