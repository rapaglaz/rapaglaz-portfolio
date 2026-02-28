# CI/CD strategy

CI/CD runs on GitHub Actions with GitHub-hosted runners.
Workflows are in `.github/workflows/`.

## Goals

- fast feedback on normal changes
- don't merge broken stuff
- don't burn time for docs-only changes

## Pull request workflow

Docs-only PRs (`docs/**`, `*.md`) are excluded at the trigger level with `paths-ignore` — the workflow simply doesn't run.

For everything else, all jobs run on every PR. Renovate PRs are the one exception: `workflow-lint`, `e2e-tests`, `lighthouse`, and `deploy-preview` are skipped for branches starting with `renovate/` — a dependency bump doesn't need actionlint, Playwright, or a preview deployment.

## Main branch checks

On main I run the full validation:

- quality checks (format, lint, i18n)
- unit tests + coverage
- Playwright E2E
- build (only if quality and E2E are green)

## E2E target

E2E runs against the preview server on port 4233 for SSG.
Locally it can run against the dev server on 4200.

## Lighthouse CI

Lighthouse is feedback only. It does not block merges.
It runs against the preview server, 3 runs, desktop preset, and only on source changes.

If you want the config, check `.lighthouserc.cjs`.
