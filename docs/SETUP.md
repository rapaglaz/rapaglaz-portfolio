# Local setup

How to run this locally.

## Requirements

- Node.js 24 (I use the version in `.nvmrc`)
- pnpm 10+

Playwright needs browsers installed once.

## Install

```bash
pnpm install
```

CI uses a frozen lockfile, so it’s best to not fight pnpm here.

## Dev server

```bash
pnpm start
```

App is on <http://localhost:4200>.

## Checks (format/lint/i18n)

```bash
pnpm run format:check
pnpm run lint
pnpm run i18n:check
```

You can also just push and let CI complain. I do both, depends.

## Unit tests

```bash
pnpm test
```

This runs Vitest via Angular’s test runner.
For coverage (like CI):

```bash
pnpm run test:coverage
```

Coverage output goes to `coverage/`.

## E2E tests (Playwright)

Normal mode uses the dev server:

```bash
pnpm run e2e
```

SSG mode builds first, then tests the static output served on port 4233:

```bash
pnpm run e2e:ssg
```

If you want the UI runner:

```bash
pnpm run e2e:ui
```

If browsers are missing:

```bash
pnpm exec playwright install --with-deps
```

## Preview (static build)

```bash
pnpm run build
pnpm run preview
```

Preview is on <http://localhost:4233>.

## Lighthouse

I run Lighthouse CI against the preview server.

```bash
pnpm run build
pnpm exec lhci autorun --config=.lighthouserc.cjs
```

It does 3 runs, desktop preset. Reports go to `.lighthouseci/`.

## Common issues

- Playwright is flaky locally: usually it’s missing browsers or old cache. Reinstall browsers and try again.
- Translations break: run `pnpm run i18n:check` (it validates JSON and key parity).
