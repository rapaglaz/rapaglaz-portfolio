# CI/CD strategy

CI/CD runs on GitHub Actions with GitHub-hosted runners.
Workflows are in `.github/workflows/`.

## Goals

- fast feedback on normal changes
- don't merge broken stuff
- deploy only when main is green

## Workflows

There are three workflows:

- `pull-request-checks.yaml` — runs on every PR
- `merge-to-main-checks.yaml` — runs on push to main (skips docs/markdown changes)
- `release.yaml` (Deploy) — triggers after Main Branch Checks succeed, deploys to production

## Pull request workflow

Jobs: `lint`, `test`, `actionlint`, `build`, `e2e-tests`, `lighthouse`, `quality-check`.

- `lint`, `test`, `actionlint`, `build` run in parallel.
- `e2e-tests` and `lighthouse` depend on `build` (reuse the build artifact).
- `quality-check` is a gate job — fails if any of `lint`, `test`, or `build` failed. Branch protection requires it to pass.

Renovate PRs skip `actionlint`, `e2e-tests`, and `lighthouse`. The `test` job still runs but skips unit tests and i18n validation — a dependency bump doesn't need those.

SonarQube analysis runs inside the `test` job on both PR and main, using `sonar-token` from GitHub Secrets.

## Main branch checks

Jobs: `lint`, `test`, `build`, `e2e-tests` — all run on every push to main.

`lint`, `test`, `build` are parallel. `e2e-tests` depends on `build`.

Pushes that only touch `docs/**` or `*.md` are ignored via `paths-ignore`.

## Deploy

Triggered automatically when Main Branch Checks completes successfully.
Renovate bot pushes are excluded — dependency bumps don't deploy.
Can also be triggered manually via `workflow_dispatch`.

Flow:

1. Build the app (SSG).
2. Upload the build artifact.
3. Deploy via FTPS to the production server (`SamKirkland/FTP-Deploy-Action`).

Credentials (`SERVER`, `USER`, `PASS`) live in GitHub Secrets.

## E2E target

E2E runs against the static build served on port 4233.
Playwright runs inside the official `mcr.microsoft.com/playwright` container.
Locally `pnpm run e2e` uses the dev server on 4200.

## Lighthouse CI

Lighthouse is feedback only. It does not block merges.
Runs on PRs only (not on main). 3 runs, desktop preset.
Results are posted as a PR comment via the GitHub token.
Config is in `.lighthouserc.cjs`.

## Concurrency

All workflows use `cancel-in-progress: true` scoped to `workflow + ref`.
Redundant runs are cancelled when a new commit is pushed to the same branch.
