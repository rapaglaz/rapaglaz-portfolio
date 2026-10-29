# Local setup

## Requirements

- Node.js 24 (exact version in `.nvmrc`)
- pnpm (exact version in the `packageManager` field of `package.json`)
- [mise](https://mise.jdx.dev/), optional. It installs the tools from `mise.toml`: actionlint and
  zizmor (the pre-commit hook runs them for commits that change workflows)

Install the dependencies:

```bash
pnpm install
```

`pnpm install` also installs the Lefthook git hooks (`lefthook.yml`, through the `prepare` script):

- `pre-commit`: lint-staged on the staged files (`.lintstagedrc.json`)
- `commit-msg`: commitlint. Messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`<type>(<scope>): <subject>`).

If the hooks do not run, install them again:

```bash
pnpm exec lefthook install
```

## Dev server

```bash
pnpm start
```

The command starts the app on <http://localhost:4200> and a local copy of the download Worker. The
routes `/en` and `/de` work directly, and `/` uses English.

The feature flag comes from `https://rapaglaz.de`. If the browser reports CORS errors, the Worker
must allow `http://localhost:4200`.

The CV download goes to the local Worker on `http://localhost:8787`. To start this Worker alone:

```bash
pnpm nx serve cv-download
```

The Worker serves a placeholder PDF from a local R2 bucket and checks the token with the test secret
of Cloudflare. This secret accepts the token of the test site key that local development uses, so
production gets no request. Without this Worker, for example with `pnpm nx serve rapaglaz-portfolio`,
the download ends with the error toast. The Worker calls the Turnstile `siteverify` endpoint, so an
outbound firewall such as Little Snitch must allow connections of `workerd`. E2E tests mock
Turnstile and `/download` instead.

## Checks

```bash
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run deps:check   # forbidden imports and cycles
pnpm run i18n:check
```

`pnpm run deps:graph` writes an HTML dependency matrix to `tmp/dependency-cruiser/dependencies.html`.
The rules are described in [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md).

## Unit tests

```bash
pnpm test                 # app and libraries, Vitest through Nx
pnpm run test:coverage    # reports in coverage/
pnpm run test:workers     # Workers, Vitest in Node
pnpm run workers:check    # bundles each Worker with wrangler deploy --dry-run, no login needed
```

The deploy of the Workers is described in [Cloudflare Workers](../apps/workers/README.md).

## E2E tests

```bash
pnpm run e2e        # against the dev server
pnpm run e2e:ssg    # builds, then tests the static output on port 4233
pnpm run e2e:ui     # Playwright UI
```

The HTML report is written to `dist/.playwright/apps/rapaglaz-portfolio-e2e/playwright-report/`.
If browsers are missing, install them:

```bash
pnpm exec playwright install --with-deps
```

## Nx

The scripts call Nx, so build, lint and test results come from the local cache when nothing they
depend on has changed. Nx 24 keeps this cache in `~/.nx/<id>/cache`, shared by all checkouts and
worktrees of the repository, so a new worktree can also get cache hits. To prove that a check
passes, run it with `--skip-nx-cache`, for example:

```bash
pnpm nx run-many -t lint --skip-nx-cache
```

If a result looks stale, run `pnpm nx reset` and then the task again.

Inside the tailnet, the local Nx can use the remote cache of CI (see
[CI/CD strategy](./CI_STRATEGY.md#nx-remote-cache)):

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
kill %1              # stops the preview server
```

Keep `--throttling-method=devtools`, because the default `simulate` mode needs a Largest
Contentful Paint for its calculation. On a plain local server the page renders so fast that Chrome
sometimes records none (`NO_LCP`). CI does three desktop runs and writes the reports to
`.lighthouseci/`.
