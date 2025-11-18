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

Problem: Takes forever. E2E can be flaky. Kills the flow when I'm iterating on changes.

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

**Conditional jobs (only if source/test files changed):**

- Unit tests with coverage — Vitest
- Build — TypeScript compilation, bundling
- E2E tests — full Playwright suite in Ubuntu container
- Preview deployment — only if self-hosted runner is available

**How different changes are handled:**

- Docs-only PR — format + lint + i18n only
- Dependency update — same as docs if no source changes
- Source code change — full suite including E2E

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

## Path Filters

CI detects what files changed and runs only relevant checks:

```yaml
source: src/**/*.ts (excluding tests)
tests: src/**/*.spec.ts, e2e/**/*.ts
docs: *.md, docs/**
i18n: public/i18n/**
```

Docs-only PRs skip all tests.

## Why E2E Only Runs for Code Changes

E2E tests run when source or test files change. This catches breaking changes before merge while keeping doc updates fast.

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

Most jobs run on my NAS (self-hosted runner). If it goes offline, the pipeline automatically falls back to GitHub-hosted runners.

E2E tests always use GitHub-hosted runners because Playwright needs specific container environment.

This saves a decent amount of GitHub Actions minutes.

## Lighthouse CI

Performance monitoring and web vitals tracking.

**When it runs:**

- Every PR (opened, updated, or reopened)
- Manual trigger via workflow_dispatch
- Weekly schedule (Monday 6:00 AM) for baseline monitoring

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

Every PR gets a sticky comment with:

- Color-coded scores (🟢 90+, 🟡 50-89, 🔴 <50)
- Link to full Lighthouse report
- Commit SHA and build number
- Environment details

This helps catch performance regressions before they reach production.

## Fork PRs

PRs from forks automatically use GitHub-hosted runners (they don't have access to self-hosted). This is also for security — don't want untrusted code running on my server.
