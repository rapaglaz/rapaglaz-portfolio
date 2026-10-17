# ADR 0002: Static prerendering with hydration instead of SSR

**Status:** Accepted · **Date:** 2025-12-19 (`feat: implement SSG`, #91)

## Context

Mostly static content plus a CV download endpoint: no login, no user data, no payments. Two
locales (`/en`, `/de`; `/` falls back to `en`). Main deploys the build output over FTPS.

## Decision

- `outputMode: static`: `src/main.server.ts` is used at build time only to prerender `/`, `/en` and
  `/de`; no server bundle is emitted.
- The browser hydrates the prerendered DOM with `provideClientHydration(withEventReplay())`
  instead of repainting it. The dev server renders client-side only.

## Alternatives considered

<!-- TODO(Paul): Which alternative did you consider, and why did you reject it? -->

## Consequences

- Browser APIs are guarded with `isPlatformBrowser(PLATFORM_ID)` (platform checks added in #91).
- No request fires during prerender; the Open to Work flag is resolved at runtime in the browser.
- CI runs E2E against the static output, and main deploys that same artifact.
