# CI/CD strategy

CI/CD runs on GitHub Actions with GitHub-hosted runners.
Workflows are in `.github/workflows/`.

## Goals

- fast feedback on normal changes
- don't merge broken stuff
- deploy only when main is green

## Workflows

There are two workflows:

- `pull-request-checks.yaml` — runs on every PR
- `main-branch-ci-cd.yaml` (Main Branch CI/CD) — runs on push to main (skips docs/markdown changes), and deploys to production when checks pass

Both workflows use `.github/actions/quality-check/action.yaml`. Its `lint` mode runs
format, lint, type check, and `pnpm run deps:check`; its `test` mode runs i18n, coverage tests, the Worker
tests and config check, and SonarCloud analysis. The dependency check fails the lint job for forbidden runtime imports
or cycles, so it also blocks the PR quality gate and main deployment.
See [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md) for the architecture policy.

The scripts behind these steps call Nx. Apart from the Worker deploy, CI runs every target in full
(no `nx affected`), but results are shared between runs through the remote cache below.

## Nx remote cache

Every job that runs Nx (`lint`, `test`, `build`, `deploy-workers`) calls
`.github/actions/nx-remote-cache` right after checkout. The action joins the tailnet with Tailscale
(tag `tag:ci`) and sets `NX_SELF_HOSTED_REMOTE_CACHE_SERVER` and
`NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN`, so Nx reads and writes the self-hosted cache server. A
`main` run after a merge then reuses the lint, test and build results of the pull request. Cached
`test` results restore `coverage/`, so SonarCloud still gets the lcov report.

Repository secrets: `NX_SELF_HOSTED_REMOTE_CACHE_SERVER`, `NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN`,
`NX_SELF_HOSTED_TS_OAUTH_CLIENT_ID`, `NX_SELF_HOSTED_TS_OAUTH_SECRET`. Without them (fork pull requests) or when Tailscale fails
to connect, the action posts a notice and Nx uses only the local cache; the cache never fails a job.

## Pull request workflow

Jobs: `lint`, `test`, `actionlint`, `zizmor`, `build`, `e2e-tests`, `lighthouse`, `quality-check`.

- `lint`, `test`, `actionlint`, `zizmor`, `build` run in parallel.
- `e2e-tests` and `lighthouse` depend on `build` (reuse the build artifact).
- `quality-check` is a gate job — requires `lint`, `test`, `actionlint`, `zizmor`, `build`, and `e2e-tests` to succeed. Failed, cancelled, or skipped jobs fail the gate. Branch protection requires it to pass.

Renovate PRs run the same checks as other PRs, including `actionlint`. Dependency updates can introduce runtime regressions even when lint and build pass (see [Engineering notes](./ENGINEERING_NOTES.md)).

SonarQube analysis runs inside the `test` job on both PR and main, using `sonar-token` from GitHub Secrets.

## Main branch CI/CD

Jobs: `lint`, `test`, `build`, `e2e-tests`, `deploy` — all run on every push to main — and the
`deploy-workers`, which the variable `DEPLOY_WORKERS` can switch off (see [Cloudflare Workers](#cloudflare-workers)).

`lint`, `test`, `build` are parallel. `e2e-tests` depends on `build`. `deploy` depends on all four.

Pushes that only touch `docs/**` or `*.md` are ignored via `paths-ignore`.

Can also be triggered manually via `workflow_dispatch` (runs the full pipeline, including deploy).

## Deploy

The `deploy` job runs only if `lint`, `test`, `build`, and `e2e-tests` all succeeded, and the push actor is not `renovate[bot]` (dependency bumps don't deploy).

Flow:

1. Download the `build-artifact-main` artifact produced by the `build` job in the same run — the exact build that e2e ran against. No rebuild.
2. Deploy via FTPS to the production server (`SamKirkland/FTP-Deploy-Action`).

Credentials (`SERVER`, `USER`, `PASS`) live in GitHub Secrets.

## E2E target

E2E runs against the static build served on port 4233.
The e2e action runs `pnpm exec nx e2e rapaglaz-portfolio-e2e`; with `CI` set, the Playwright
config serves `dist/apps/rapaglaz-portfolio/browser` itself. On failure the action uploads the
HTML report from `dist/.playwright/apps/rapaglaz-portfolio-e2e/playwright-report`.
The e2e jobs run on `ubuntu-latest`, not in the Playwright container: Tailscale needs `sudo` and
a TUN device, which the container lacks, so the job could not reach the remote cache. The action
runs `nx e2e rapaglaz-portfolio-e2e --configuration=ci`, whose command runs
`playwright install --with-deps chromium webkit` before the tests. The install is part of the
Nx task, so a cache hit skips it together with the tests.

The `e2e` target is cacheable. Its inputs are the e2e sources, the production inputs of the app,
`E2E_MODE`, `CI`, and the Playwright version, so `main` reuses the result of the pull request run
for the same code. Nx caches only successful runs, so a rerun after a failure runs the tests again.
Locally `pnpm run e2e` uses the dev server on 4200.

## Lighthouse

Lighthouse is feedback only. It does not block merges.
Runs on PRs only (not on main). 3 runs, desktop preset, the run with the
median performance score is used for reporting.
Results are posted as a PR comment via the GitHub token; the full HTML
report is uploaded as a workflow artifact (`lighthouse-report`).

Runs the `lighthouse` CLI directly (`.github/actions/lighthouse/report`)
rather than `treosh/lighthouse-ci-action`/`@lhci/cli` - the latter pins an
older Lighthouse version that reliably fails with `NO_LCP` on a bare local
server (the page paints too fast for Chrome to ever record a Largest
Contentful Paint candidate), even with `throttlingMethod: devtools` and
aggressive throttling values. The `lighthouse` CLI's current release
doesn't have this problem for the scored categories with plain
`--throttling-method=devtools`.

The job log can still show `LanternError: NO_LCP` (up to once per run, so
up to 3 times) - that comes from Lighthouse's separate trace-engine "Insights"
analysis (`@paulirish/trace_engine`), not from the scored audits, and
doesn't affect the reported category scores. It's cosmetic log noise, and
the `lighthouse` job also runs with `continue-on-error: true`, so it never
blocks the PR either way.

## Concurrency

All workflows use `cancel-in-progress: true` scoped to `workflow + ref`.
Redundant runs are cancelled when a new commit is pushed to the same branch.

## Cloudflare Workers

`deploy-workers` in Main Branch CI/CD deploys the Workers that `nx affected` reports since the last
green run on `main`, after `lint` and `test`. Comparing with the previous push instead would lose
the changes of a run that was cancelled by a newer push or failed. Each Worker is its own Nx
project, so a change in one Worker deploys only that Worker; a change to `nx.json`,
`tsconfig.base.json`, the Workers' own `apps/workers/eslint.config.mjs` or an Nx plugin version
deploys all of them. With `projectsAffectedByDependencyUpdates: "auto"` other dependency updates
deploy no Worker, because the Workers import no npm package. The job runs `test` and `check` before
it passes the Cloudflare secrets to the `deploy` step. The repository variable `DEPLOY_WORKERS` is a
kill switch: the job runs only while it is `true`. It runs `wrangler deploy` with the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
Pull requests never get these secrets; they only bundle the Workers with `wrangler deploy --dry-run`.
See [Cloudflare Workers](../apps/workers/README.md) for the configuration and the first deploy.
