# CI/CD strategy (private)

The actual CI pipeline lives on my NAS, so workflows are not in this repo.
I still keep a clear, simple strategy and the repo has scripts to run checks locally.

## Goals

- fast feedback on normal changes
- don’t merge broken stuff
- don’t burn time for docs-only changes

## What the private pipeline does

I use path-based checks to decide what to run.
High level flow:

- docs-only: skip heavy checks
- app code changed: format + lint + i18n checks, and unit tests
- app or e2e changed: run Playwright E2E
- if quality or E2E ran: run a build job
- if workflows changed (in the private repo): run actionlint

Notes:

- i18n checks run when app files or translations changed
- unit tests with coverage only run when app files changed
- Sonar runs when tests ran and the token is available

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
It runs against the preview server, 3 runs, desktop preset.

If you want the config, check `.lighthouserc.cjs`.
