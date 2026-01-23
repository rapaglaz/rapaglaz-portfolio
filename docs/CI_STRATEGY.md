# CI/CD strategy

CI/CD runs on GitHub Actions with GitHub-hosted runners.
Workflows are in `.github/workflows/`.

## Goals

- fast feedback on normal changes
- don't merge broken stuff
- don't burn time for docs-only changes

## Pull request workflow

I use path-based checks to decide what to run.
High level flow:

- docs-only: skip heavy checks
- app code changed: format + lint + i18n checks, and unit tests
- app or e2e changed: run Playwright E2E
- if quality or E2E ran: run a build job and deploy PR preview
- if workflows changed: run actionlint

Notes:

- i18n checks run when app files or translations changed
- unit tests with coverage only run when app files changed
- Sonar runs when tests ran and the token is available
- PR previews deploy to GitHub Pages at `previews/pr-{number}/`
- Build action supports optional `base-href` parameter for PR previews

## Main branch checks

On main I run the full validation:

- quality checks (format, lint, i18n)
- unit tests + coverage
- Playwright E2E
- build (only if quality and E2E are green)

## E2E target

E2E runs against the preview server on port 4233 for SSG.
Locally it can run against the dev server on 4200.

## Reusable Actions

### Build Action (`.github/actions/build-action`)

Composite action that sets up the environment and builds the Angular application.

**Inputs:**

- `base-href` (optional): Base href for the application. If not provided, builds with default settings.

**Usage:**

```yaml
- uses: ./.github/actions/build-action
  with:
    base-href: /my-app/preview/ # optional
```

This action is used by:

- PR preview builds (with custom base-href for subdirectory deployment)
- Production builds (without base-href for root deployment)

## Lighthouse CI

Lighthouse is feedback only. It does not block merges.
It runs against the preview server, 3 runs, desktop preset.

If you want the config, check `.lighthouserc.cjs`.
