# Local setup

## Requirements

- Node.js 24 (exact version in `.nvmrc`)
- pnpm (exact version in `packageManager` in `package.json`)
- [mise](https://mise.jdx.dev/), only if you commit workflow changes: the pre-commit hook runs
  actionlint and zizmor at the versions in `mise.toml`

```bash
pnpm install
```

`pnpm install` also installs the Lefthook git hooks (`lefthook.yml`, through the `prepare` script):

- `pre-commit`: lint-staged on staged files (`.lintstagedrc.json`)
- `commit-msg`: commitlint. Messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`<type>(<scope>): <subject>`).

If the hooks do not run, try `pnpm exec lefthook install`.

## Dev server

```bash
pnpm start
```

It starts the app and a local copy of the download Worker. App is on <http://localhost:4200>.
You can use `/en` or `/de` directly, and `/` defaults to English.

The feature flag comes from `https://rapaglaz.de`. If you see CORS errors, the Worker must allow
`http://localhost:4200`.

The CV download goes to the local Worker on `http://localhost:8787` (`pnpm nx serve cv-download`
starts it alone). It serves a placeholder PDF from a local R2 bucket and checks the token with
Cloudflare's test secret, which accepts the token of the test site key that local dev uses.
Production gets no request. Without this Worker, for example with
`pnpm nx serve rapaglaz-portfolio`, the download ends in the error toast. The Worker calls
Turnstile's `siteverify`, so an outbound firewall such as Little Snitch must let `workerd` connect.
E2E mocks Turnstile and `/download` instead.

## Checks

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run deps:check   # forbidden imports and cycles
pnpm run i18n:check
```

`pnpm run deps:graph` writes an HTML dependency matrix to `tmp/dependency-cruiser/dependencies.html`.
The rules are in [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md).

## Unit tests

```bash
pnpm test                 # app and libraries, Vitest through Nx
pnpm run test:coverage    # reports in coverage/
pnpm run test:workers     # Workers, Vitest in Node
pnpm run workers:check    # bundles each Worker with wrangler deploy --dry-run, no login needed
```

Deploying the Workers is described in [Cloudflare Workers](../apps/workers/README.md).

## E2E tests

```bash
pnpm run e2e        # against the dev server
pnpm run e2e:ssg    # builds, then tests the static output on port 4233
pnpm run e2e:ui     # Playwright UI
```

The HTML report goes to `dist/.playwright/apps/rapaglaz-portfolio-e2e/playwright-report/`. If
browsers are missing, run `pnpm exec playwright install --with-deps`.

## Nx

The scripts call Nx, so build, lint and test results come from the local cache in `.nx/` when
nothing they depend on has changed. If a result looks stale, run `pnpm nx reset` and the task again.
On the tailnet you can share the cache of CI (see [CI strategy](./CI_STRATEGY.md#nx-remote-cache)):

```bash
export NX_SELF_HOSTED_REMOTE_CACHE_SERVER=<cache server URL>
export NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=<access token>
```

`pnpm nx show projects` lists the apps, Workers and libraries, and `pnpm nx graph` opens the project
graph.

## Preview and Lighthouse

```bash
pnpm run build
pnpm run preview &   # static build on http://localhost:4233
pnpm exec lighthouse http://localhost:4233 --preset=desktop --throttling-method=devtools
```

Keep `--throttling-method=devtools`. On a plain local server the page renders so fast that Chrome
sometimes records no Largest Contentful Paint (`NO_LCP`), and the default `simulate` mode needs one
for its calculation. CI does three desktop runs and writes the reports to `.lighthouseci/`.
