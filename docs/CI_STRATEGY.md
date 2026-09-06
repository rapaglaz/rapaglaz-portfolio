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

## Pull request workflow

Jobs: `lint`, `test`, `actionlint`, `build`, `e2e-tests`, `lighthouse`, `quality-check`.

- `lint`, `test`, `actionlint`, `build` run in parallel.
- `e2e-tests` and `lighthouse` depend on `build` (reuse the build artifact).
- `quality-check` is a gate job — fails if `lint` or `build` failed, or if `test` failed (a skipped `test` is accepted). Branch protection requires it to pass.

Renovate PRs skip `test`, `actionlint`, `e2e-tests`, and `lighthouse` — a dependency bump doesn't need those, and lockfile changes are still covered by `lint` and `build`.

SonarQube analysis runs inside the `test` job on both PR and main, using `sonar-token` from GitHub Secrets.

## Main branch CI/CD

Jobs: `lint`, `test`, `build`, `e2e-tests`, `deploy` — all run on every push to main.

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
