# Local Setup

How to get this running on your machine.

## Prerequisites

- **Node.js 24** (check `.nvmrc`)
- **pnpm 10+**

Playwright needs browsers installed once. If they are missing, run the install command below.

## Install

```bash
pnpm install
```

Lockfile is frozen in CI so your local install matches exactly.

## Dev Server

```bash
pnpm start
```

Opens on `http://localhost:4200`.

## Quality Checks

Before committing changes:

```bash
pnpm run format:check  # Prettier
pnpm run lint          # ESLint
pnpm run i18n:check    # Transloco validation
```

Or just let CI catch issues. Up to you.

## Unit Tests

```bash
pnpm test
```

Runs Vitest through the Angular test runner. Add `--watch=false` for single-run mode (like in CI).

Coverage report goes to `coverage/lcov.info`.

## E2E Tests

```bash
pnpm run e2e
```

Starts the dev server (if not already running) and runs Playwright tests.

First run downloads browsers — takes about a minute. After that it's fast.

For SSG build tests:

```bash
pnpm run e2e:ssg
```

This builds the static output and runs Playwright against the preview server.

For debugging:

```bash
pnpm run e2e:ui
```

Opens the Playwright UI with step-by-step test execution.

## Lighthouse CI

Run performance audits locally:

```bash
# Build the app first
pnpm run build

# Run Lighthouse CI
pnpm exec lhci autorun --config=.lighthouserc.cjs
```

This runs the same audits as CI:

- Starts preview server on port 4233
- Runs Lighthouse 3 times (desktop preset)
- Shows median scores for Performance, Accessibility, Best Practices, SEO
- Generates HTML reports in `.lighthouseci/`

Results are saved but not uploaded when running locally.

## Production Build

```bash
pnpm run build
```

Output goes to `dist/rapaglaz-portfolio/browser/`. This is a static (SSG) build and it is what gets deployed.

## Preview Build

```bash
pnpm run preview
```

Serves the static production build locally on port 4233.

## Common Issues

**Playwright won't start:**
Run `pnpm exec playwright install --with-deps` to reinstall browsers and dependencies.

**Self-hosted runner not picking up jobs:**
Check the logs in GitHub Actions. If runner is offline, it falls back to GitHub-hosted runners automatically.

**Translation errors:**
Run `pnpm run i18n:check` to validate JSON structure and key parity across languages. Missing keys fail the build in CI.

## Development Tips

- Run `pnpm test` in watch mode while writing tests
- E2E tests mock Turnstile API so you don't need real verification tokens
- Browser devtools work normally with Angular's build setup
- Signal updates trigger change detection automatically (no need for `markForCheck`)

## Environment

No `.env` file needed for local development. Everything uses defaults or test values.

Production configuration comes from Cloudflare Workers environment variables.
