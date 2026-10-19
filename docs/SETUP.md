# Local setup

How to run this locally.

## Requirements

- Node.js 24 (exact version in `.nvmrc`)
- pnpm (exact version in `packageManager` in `package.json`)
- [mise](https://mise.jdx.dev/), only when committing workflow changes: the pre-commit hook runs
  actionlint and zizmor at the versions pinned in `mise.toml`

Playwright needs browsers installed once.

## Install

```bash
pnpm install
```

## Git hooks (Lefthook)

Hooks are installed by Lefthook during `pnpm install` (via the `prepare` script).
Configuration lives in `lefthook.yml`.

- `pre-commit`: Runs lint-staged on staged files using `.lintstagedrc.json`
- `commit-msg`: Validates commit message format using commitlint (configured in `commitlint.config.cjs`)

If hooks do not run, try `pnpm run prepare` or `pnpm exec lefthook install`.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
(`<type>(<scope>): <subject>`); commitlint rejects anything else.

## Dev server

```bash
pnpm start
```

App is on <http://localhost:4200>.
You can use `/en` or `/de` directly, and `/` defaults to English.

Note: the feature flag endpoint is on `https://rapaglaz.de`.
If you see CORS errors locally, the Worker must allow `http://localhost:4200`.

The CV download also calls the production Worker. It rejects the token from Cloudflare's test site
key that local dev uses, so locally the download ends in the error toast. E2E mocks Turnstile and
`/download` instead.

## Checks (format/lint/dependencies/i18n)

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run deps:check
pnpm run i18n:check
```

`deps:check` exits non-zero for forbidden runtime dependencies or circular imports.
Use `pnpm run deps:graph` to generate a local HTML dependency matrix in
`tmp/dependency-cruiser/dependencies.html`; `tmp/` is already git-ignored.
See [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md) for the rules and exceptions.

## Unit tests

```bash
pnpm test
```

This runs Vitest through Nx (`@nx/vitest`) with AnalogJS.
For coverage:

```bash
pnpm run test:coverage
```

Coverage output goes to `coverage/apps/rapaglaz-portfolio/`.

The Cloudflare Workers in `apps/workers/` are one Nx project each and run Vitest in a Node environment:

```bash
pnpm run test:workers
```

`pnpm run workers:check` bundles each Worker with `wrangler deploy --dry-run` and needs no Cloudflare
login. Deploying is described in [Cloudflare Workers](../apps/workers/README.md).

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

The HTML report goes to `dist/.playwright/apps/rapaglaz-portfolio-e2e/playwright-report/`.

If browsers are missing:

```bash
pnpm exec playwright install --with-deps
```

## Nx

The `pnpm run` scripts call Nx, so build, lint and test results come from the local cache in
`.nx/` when nothing they depend on has changed.

```bash
pnpm nx show projects                    # rapaglaz-portfolio, rapaglaz-portfolio-e2e
pnpm nx show project rapaglaz-portfolio  # resolved targets, inputs and outputs
pnpm nx graph                            # project graph in the browser
pnpm nx reset                            # clear the cache and stop the daemon
```

## Preview (static build)

```bash
pnpm run build
pnpm run preview
```

Preview is on <http://localhost:4233>.

## Lighthouse

I run Lighthouse against the preview server.

```bash
pnpm run build
pnpm run preview &
pnpm exec lighthouse http://localhost:4233 --preset=desktop --throttling-method=devtools
```

`--throttling-method=devtools` matters here: on a bare local server the page
paints fast enough that Chrome sometimes never records a Largest Contentful
Paint candidate at all (`NO_LCP`), which the default `simulate` throttling
can't work around since it needs a real candidate to extrapolate from. CI
does 3 runs, desktop preset, and reports go to `.lighthouseci/`.

## Common issues

- Playwright is flaky locally: usually missing browsers or old cache. Reinstall and retry.
- Translations break: run `pnpm run i18n:check`.
- A task result looks stale: run `pnpm nx reset` and run the task again.
