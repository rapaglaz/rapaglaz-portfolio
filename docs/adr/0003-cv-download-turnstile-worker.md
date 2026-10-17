# ADR 0003: CV download via Turnstile and a Worker in front of R2

**Status:** Accepted · **Date:** 2025-11-17 (initial commit `67a81f4`)

## Context

The CV should not be a public URL that bots can scrape forever. The site is static; `/config`,
`/download` and `/feature-flag` are Cloudflare Workers. The Worker code is not in this repo.

## Decision

1. `ConfigService` fetches the Turnstile site key from `/config` and validates it with Valibot.
2. `turnstile.interceptor` sends the Turnstile token to `/download` as `cf-turnstile-response`.
3. The Worker validates the token with Cloudflare and streams the PDF from R2 (`no-store`).
4. The browser receives the PDF as a blob and saves it with a locale-specific filename.

## Alternatives considered

<!-- TODO(Paul): Which alternative did you consider, and why did you reject it? -->

## Consequences

- A blocked script or failed verification ends in a generic error toast; E2E covers both (#503).
- Since #757 an interactive challenge opens in a CDK Dialog with a focus trap and focus restored to
  the CV button. Local dev and prerender use Cloudflare's test site key.
