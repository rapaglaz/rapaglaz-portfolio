# CI/CD Pipeline

How the pipeline works and why I set it up this way.

## The Problem

Wanted to solve three things:

1. Reasonable feedback — PR checks that don't take forever
2. Reliable quality — nothing broken gets merged
3. Low cost — self-hosted runner has limited capacity

These usually don't play well together.

## What I Tried

**Option 1: Run everything on every PR**
Lint + unit + E2E + SonarCloud on every commit.

Problem: Takes forever. E2E can be flaky. Kills the flow when iterating on changes.

**Option 2: Skip CI, rely on local testing**
Run tests before pushing.

Problem: I forget. Everyone forgets. That's why CI exists.

**Option 3: Conditional pipeline (what I use now)**
Run only what changed. Skip tests for docs-only changes. Full validation when code changes.

Most PRs touch source code so the full suite still runs. But at least docs-only changes are quick.

## How It Works

### PR Checks (Conditional)

Goal: Run only what's needed based on what changed.

**Always runs:**

- Path detection — figures out which files changed
- Format check — Prettier
- Lint — ESLint + Angular rules
- i18n validation — Transloco JSON check

**Conditional jobs:**

- Quality check (lint + unit tests + coverage + Sonar) — runs when app files change (`src/**`, `public/**`, `angular.json`, `tsconfig*.json`, `package.json`, `eslint.config.mjs`) or i18n (`public/i18n/**`)
- E2E tests — runs when app files change or `e2e/**/*.ts` / `playwright.config.*` change
- Build — runs when quality or E2E ran (reuses the same build action)
- Preview deployment — only if self-hosted runner is chosen and build passed
- Workflow lint — when workflow YAML changes (`.github/workflows/**`)

**Always runs (separate workflow):**

- [Lighthouse CI](#lighthouse-ci) — performance testing (conditional: skips if only docs/i18n/CI changed)

**How different changes are handled:**

- Docs-only PR — format + lint + i18n only
- Workflow change — format + lint + i18n + actionlint
- Dependency update — same as docs if no source changes
- Source code change — full suite including E2E
- E2E-only change — E2E + build (quality skipped)

**Cancellation:**

Every new commit cancels previous run. No wasted compute on outdated commits.

### Main Branch Checks (Full Validation)

Goal: Complete validation after merge.

**Always runs:**

- Quality check (format, lint, i18n, unit tests + coverage, SonarCloud)
- E2E tests (Playwright)
- Build (only if quality + E2E both pass)

If something fails here, I know exactly which PR broke it and can revert quickly.

Build job waits for quality + E2E to pass so we don't deploy broken builds.

### Release/Deploy Workflow (Maximum Speed)

Goal: Deploy as fast as possible. Zero redundant validation.

**How it works:**

```text
pick-runner -> build -> deploy
```

**What runs:**

- Environment protection — enforced by GitHub at repository level
- Build — compile the app
- Deploy — upload to production

**What's skipped (everything):**

- Format check — already on main
- Lint — already on main
- i18n validation — already on main
- Unit tests + coverage — already on main
- SonarCloud — already on main
- E2E tests — already on main

**Branch protection:**

Workflow uses `environment: production` on the first job. This enforces branch restrictions at repository level through GitHub Environment protection rules.

Can't be bypassed by modifying workflow file. If you trigger from wrong branch, it fails immediately.

**Why this works:**

Deploy is restricted to main branch only via environment protection. Main branch already passed full validation suite (format, lint, i18n, tests+coverage, SonarCloud, E2E).

There's no point re-running the same checks for third time. Code reaching deploy workflow was validated twice: once in PR, once after merge to main.

**Before deploying:**

Check GitHub Actions to make sure main branch has green checks. That's it. If main is green, deploy is safe.

**If main checks failed:**

Fix main first. Don't deploy broken code. The workflow won't save you — there are no quality gates, it trusts main completely.

## Path Filters

CI detects what changed and runs only relevant checks:

- Docs-only PRs skip unit tests, E2E, build, and preview. Only lint + format + i18n.
- Workflow changes trigger actionlint (static analysis for GitHub Actions). Doesn't lint composite actions.
- Source changes include `src/**`, `public/**`, `angular.json`, `tsconfig*.json`, `package.json`, and `eslint.config.mjs` because they affect the build.
- E2E tests run when `e2e/**/*.ts` or `playwright.config.*` changes, or when app code changes.
- Translations (`public/i18n/**`) trigger quality checks but not E2E by themselves.

## Why E2E Only Runs for Code Changes

E2E tests run when app files change or when `e2e/**/*.ts` / Playwright config changes. This catches breaking changes before merge while keeping doc updates fast.

E2E always uses GitHub-hosted runners (Ubuntu container with Playwright pre-installed) — more reliable than self-hosted for browser testing.

## Why This Works

**Small PRs** (docs, i18n, config changes):

- Quick feedback
- No wasted compute on tests that don't matter

**Code changes:**

- Full validation before merge
- E2E catches breaking changes early
- Preview deployment available for manual testing

**Main branch:**

- Double-check everything actually passed
- Generate test coverage reports
- Update SonarCloud metrics

Combined with `cancel-in-progress`, you never wait for outdated runs. New commit = cancel old run, start fresh.

## Self-Hosted Runner

Most jobs run on my NAS (self-hosted runner). If it goes offline, pipeline falls back to GitHub-hosted runners automatically.

E2E tests always use GitHub-hosted runners because Playwright needs specific container environment.

This saves a decent amount of GitHub Actions minutes 🙂.

## Lighthouse CI

Performance monitoring and web vitals tracking.

**When it runs:**

- Every PR (opened, updated, or reopened) — but only if app files changed (`src/**`, `public/**`, `angular.json`)
- Manual trigger via workflow_dispatch
- Weekly schedule (Monday 6:00 AM) for baseline monitoring

**Change detection:**

Lighthouse skips runs when only these change:

- Documentation (`.md` files)
- Translations (`public/i18n/**`)
- CI workflows (`.github/**`)
- Test files (`*.spec.ts`)
- E2E tests (`e2e/**/*.ts`)

Runs when these change:

- Application source (`src/**`)
- Public assets (`public/**`)
- Build config (`angular.json`)

**What it does:**

- Builds the application
- Runs Lighthouse 3 times (median score reported)
- Tests desktop performance
- Comments PR with scores and color-coded badges
- Uploads full reports to temporary public storage

**Configuration:**

- **Desktop preset** — optimized for desktop users
- **Assertions set to 'warn'** — never fails the build, only provides feedback
- **Thresholds:**
  - Performance: 80+
  - Accessibility: 90+
  - Best Practices: 80+
  - SEO: 90+
  - PWA: disabled

**Why warnings instead of failures:**

Lighthouse scores can vary between runs due to network conditions, CPU load, etc. Setting assertions to `warn` means:

- You get feedback without blocking merges
- Can track trends over time
- Manual review of significant drops
- No false positives from flaky runs

**PR Comments:**

Every PR gets a comment with:

- Link to full Lighthouse report
- Commit SHA and build number
- Environment details

Helps catch performance regressions before they reach production.

## Fork PRs

PRs from forks automatically use GitHub-hosted runners (they don't have access to self-hosted). Also for security — don't want untrusted code running on my server.
