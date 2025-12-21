# Local setup

How to run this locally.

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 10+

Playwright needs browsers installed once.

## Install

```bash
pnpm install
```

## Dev server

```bash
pnpm start
```

App is on <http://localhost:4200>.
You can use `/en` or `/de` directly, and `/` defaults to English.

Note: the feature flag endpoint is on `https://rapaglaz.de`.
If you see CORS errors locally, the Worker must allow `http://localhost:4200`.

## Checks (format/lint/i18n)

```bash
pnpm run format:check
pnpm run lint
pnpm run i18n:check
```

## Unit tests

```bash
pnpm test
```

This runs Vitest via Angular’s test runner.
For coverage:

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

UI runner:

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

- Playwright is flaky locally: usually missing browsers or old cache. Reinstall and retry.
- Translations break: run `pnpm run i18n:check`.
