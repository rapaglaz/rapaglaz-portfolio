# CI/CD strategy

GitHub Actions on GitHub-hosted runners. The goals are fast feedback, no broken merges and a deploy
only from a green `main`.

## Workflows

| Workflow                   | Runs on                                                                          | When a new push comes                                      |
| -------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pull-request-checks.yaml` | every PR                                                                         | it cancels the running run of the same PR                  |
| `main-branch-ci-cd.yaml`   | push to `main`, except pushes that change only `docs/**` or `*.md`; manual start | runs queue, so a newer push cannot cancel a running deploy |

On `main`, GitHub keeps only the newest pending run, so a series of pushes still ends in one run of
the latest commit. Both workflows start with `permissions: {}`, and each job gets only the
permissions it needs.

Both workflows use `.github/actions/quality-check`:

- `lint` mode: format check, lint, type check and `deps:check`;
- `test` mode: i18n check, unit tests with coverage, Worker tests and `workers:check`. The coverage
  reports go to an artifact for the `sonar` job.

The scripts call Nx. CI runs every target with `run-many`, not only the affected projects. The
remote cache skips the tasks whose inputs did not change.

## Nx remote cache

Every job that runs Nx first calls `.github/actions/nx-remote-cache`. The action joins my tailnet
with Tailscale, checks the `/health` endpoint of the self-hosted cache server and only then points
Nx at it. Without the secrets (fork PRs) or without a connection, Nx uses the local cache, so the
cache never fails a job.

The cache has two spaces, one per access token:

- **Shared space** (`NX_CACHE_PR_TOKEN`): all PR jobs, and `lint`, `test`, `e2e-tests` and
  `deploy-workers` on `main`. A `main` run after a merge reuses the lint, test and E2E results of
  the PR, including `coverage/` for SonarCloud.
- **Main space** (`NX_CACHE_MAIN_TOKEN`): only the `build` job on `main`. The token is a secret of
  the `production` environment, which only `main` can use, so no PR can write a build that is
  deployed later.

E2E on `main` may come from the shared space on purpose. A planted E2E result could only hide a
failing test. It cannot change the deployed files, because the build comes from the main space.

## Pull requests

`lint`, `test` and `build` run in parallel. The `lint` job also runs actionlint and zizmor in the
versions from `mise.toml`. They run even when lint failed, so one run shows every finding.
`e2e-tests` and `lighthouse` start after `build`, and `sonar` starts after `test`.

`quality-check` is the gate. It needs `lint`, `test`, `build` and `e2e-tests`, and every result other
than success fails it, also a canceled or skipped job. A repository ruleset on `main` requires
`quality-check` and `build`. `sonar` and `lighthouse` do not block. Renovate PRs run the same
checks, because dependency updates can break things that lint and build do not catch (see the
[engineering notes](./ENGINEERING_NOTES.md)).

## Main branch and deploy

`lint`, `test`, `build` and `workflow-lint` run in parallel. `sonar` starts after `test`, and
`e2e-tests` after `build`. `workflow-lint` runs actionlint and zizmor, because a direct push to
`main` skips the PR checks. `sonar` and `workflow-lint` do not block the deploy.

`deploy` needs `lint`, `test`, `build` and `e2e-tests`. It downloads the build artifact of the same
run, which is the build that E2E tested, and uploads it over FTPS. There is no second build. The FTP
secrets are in the `production` environment.

The repository variable `DEPLOY_SITE` stops site deploys without a commit, for example during an
incident: the job is skipped while the variable is `false`. A missing variable deploys, so Renovate
merges deploy too.

## E2E

E2E runs against the static build on port 4233, in one job per browser: `chromium` and `webkit`,
with the Nx configurations `ci-chromium` and `ci-webkit`. `fail-fast: false` keeps one browser
running when the other fails, so one run shows both results.

The jobs run on `ubuntu-latest`, not in the Playwright container, because Tailscale needs `sudo`
and a TUN device. Each configuration installs its browser inside the Nx task, so a cache hit skips
the install together with the tests. The cache inputs include the versions of `@playwright/test`
and `@axe-core/playwright`, and Nx caches only successful runs.

Retries on CI can turn a failing test into a green job. After every run, a step writes the flaky
tests from the Playwright JSON report into the job summary. This step only reports and never fails
the job. When the tests fail, the HTML report is uploaded as an artifact.

## Lighthouse

Lighthouse does not block a PR. On every PR it runs three times with the desktop preset. The run
with the median performance score goes into a PR comment, and its HTML report is uploaded as an
artifact.

The job calls the `lighthouse` CLI directly, because `@lhci/cli` and `treosh/lighthouse-ci-action`
use an older Lighthouse that fails with `NO_LCP` on a plain local server. A `LanternError: NO_LCP`
line can still appear in the log. It comes from the "Insights" analysis and does not change the
scores.

## Cloudflare Workers

`deploy-workers` runs on `main` after `lint`, `test`, `build` and `e2e-tests`. It deploys the
Workers that `nx affected` reports since the head SHA of the last successful `main` run, so the
changes of a canceled or failed run are not lost. Without a known base, every Worker deploys. The
job runs only while the repository variable `DEPLOY_WORKERS` is `true`. Pull requests never get the
Cloudflare secrets. They only run `wrangler deploy --dry-run`. Details:
[Cloudflare Workers](../apps/workers/README.md).
