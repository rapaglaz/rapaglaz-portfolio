# CI/CD strategy

This repo is small, but I still like having good checks.
I also don’t want every PR to take 20 minutes.

So the pipeline is a bit conditional. It runs what matters based on what changed.

## Goals

- fast feedback on normal PRs
- don’t merge broken stuff
- don’t burn money / runner time for docs-only changes

I run most jobs on a self-hosted runner. If it is offline, the workflow falls back to GitHub-hosted runners.

## PR checks

On pull requests I first detect changed paths, then decide what to run.

In simple terms:

- docs-only: basically nothing (just the change detection)
- app code changed: run format + lint + i18n checks, and unit tests
- app or e2e changed: run Playwright E2E
- if quality or E2E ran: run a build job
- if workflows changed: run actionlint

Notes:

- i18n checks run when app files or translations changed
- unit tests with coverage only run when app files changed
- SonarCloud runs when tests ran and the token is available

Every new commit cancels the previous run. I don’t want to waste time on old commits.

## Main branch checks

On main it is the full validation:

- quality checks (format, lint, i18n)
- unit tests + coverage
- Playwright E2E
- build (only if quality and E2E are green)

This is the “final truth”. If something fails here, I know a PR broke it.

## Release/deploy

Deploy is kept simple and fast.
The idea is: main already passed checks, so don’t repeat them again.

There is environment protection on GitHub for production.
So even if someone edits workflows, they can’t just deploy from a random branch.

## Playwright runner choice

E2E runs on GitHub-hosted runners in a Playwright container.
That is just more reliable than doing browser stuff on my NAS runner.

In CI, tests run against the preview server on port 4233 (static build).
Locally it usually runs against the dev server on 4200.

## Lighthouse CI

Lighthouse is feedback only. It does not block merges.

- runs on PRs when app files changed
- also runs weekly on a schedule
- 3 runs, desktop preset, upload to temporary public storage

All assertions are `warn` on purpose. Lighthouse can be noisy.

If you want the exact details, check `.lighthouserc.cjs`.
