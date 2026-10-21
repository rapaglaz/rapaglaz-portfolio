# CI/CD strategy

GitHub Actions on GitHub-hosted runners. What I want from it: fast feedback, no broken merges, and
a deploy only when `main` is green.

## Workflows

- `pull-request-checks.yaml` runs on every PR.
- `main-branch-ci-cd.yaml` runs on push to `main` and deploys when the checks pass. Pushes that only
  touch `docs/**` or `*.md` are ignored. You can also start it by hand.

In both, a new push cancels the running workflow for the same branch. Both use
`.github/actions/quality-check`. Its `lint` mode runs format, lint, type check and `deps:check`. Its
`test` mode runs i18n, unit tests with coverage, the Worker tests and config check, and SonarCloud.

The scripts call Nx. CI runs every target in full, without `nx affected`, and a remote cache shares
the results between runs.

## Nx remote cache

Every job that runs Nx first calls `.github/actions/nx-remote-cache`. It joins my tailnet with
Tailscale and points Nx at a self-hosted cache server. A `main` run after a merge then reuses the
lint, test and build results of the PR, including `coverage/` for SonarCloud. Without the secrets
(fork PRs) or without a connection, Nx uses the local cache. The cache never fails a job.

## Pull requests

`lint`, `test`, `actionlint`, `zizmor` and `build` run in parallel. `e2e-tests` and `lighthouse`
use the build artifact.

`quality-check` is the gate. It needs everything except Lighthouse, and a failed, cancelled or
skipped job fails it. Branch protection requires it. Renovate PRs run the same checks, because
dependency updates can break things that lint and build do not catch (see the
[engineering notes](./ENGINEERING_NOTES.md)).

## Main branch and deploy

`lint`, `test` and `build` run in parallel, then `e2e-tests`, then `deploy`. Deploy runs only when
all four passed and the push is not from `renovate[bot]`. It downloads the build artifact of the
same run, the exact build that E2E tested, and uploads it over FTPS. There is no second build.

## E2E

E2E runs against the static build on port 4233. The jobs run on `ubuntu-latest`, not in the
Playwright container, because Tailscale needs `sudo` and a TUN device. The browser install is part
of the cached Nx task, so a cache hit skips it together with the tests. The cache key includes the
Playwright version, and Nx caches only successful runs.

## Lighthouse

Feedback only. Three desktop runs on every PR. The median goes into a PR comment, and the full
report is uploaded as an artifact.

It calls the `lighthouse` CLI directly, because `@lhci/cli` and `treosh/lighthouse-ci-action` use an
older Lighthouse that fails with `NO_LCP` on a bare local server. A `LanternError: NO_LCP` line can
still appear in the log. It comes from the "Insights" analysis and does not change the scores.

## Cloudflare Workers

`deploy-workers` runs on `main` after `lint` and `test`. It deploys the Workers that `nx affected`
reports since the last green run, so a cancelled or failed run does not lose its changes. The
repository variable `DEPLOY_WORKERS` switches it off. Pull requests never get the Cloudflare
secrets. They only run `wrangler deploy --dry-run`. Details:
[Cloudflare Workers](../apps/workers/README.md).
