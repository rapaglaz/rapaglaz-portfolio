# Security

This is a portfolio site, not a bank.
Still, I don't want it to be sloppy.

There is no login, no user data storage, no payments.
It's mostly static content + a CV download endpoint.

## Headers

I set basic security headers at the Cloudflare edge (Workers).

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Short version:

- force HTTPS
- stop iframe embedding
- reduce referrer leakage
- disable browser APIs I don't need

## Subresource Integrity (SRI)

The production build has `subresourceIntegrity: true` in `angular.json`.
Angular injects `integrity` and `crossorigin` attributes on all script and style tags.
This prevents tampered assets from executing even if the CDN or server is compromised.

## CV download protection

I don't want the CV to be a public URL that bots can scrape forever.
Downloads go through Cloudflare Turnstile + a Worker.

Flow:

1. User clicks "CV"
2. Turnstile runs (sometimes invisible, sometimes it asks)
3. Frontend sends the token to the Worker (via `X-Turnstile-Token` header, injected by `turnstile.interceptor`)
4. Worker validates the token against Cloudflare
5. If ok, Worker returns a signed R2 URL

The signed link is short lived (5 minutes).

## Input validation

All HTTP responses from Cloudflare Workers (`/config`, `/download`, `/feature-flag`) are validated with Valibot before use.
Invalid or unexpected shapes are rejected rather than passed into the app.

## Error handling and logging

`LoggerService` is the single place for logging.
Internal error details are never exposed to the user — only generic messages are shown.
Tokens, API keys, and PII are never logged.

## Dependencies and secrets

No secrets in the repo.
Sensitive values live in GitHub Secrets or Cloudflare config.

Renovate handles dependency updates.
OSV vulnerability alerts are enabled with automatic patch automerge.

## Threat model (simple)

| Threat          | What I do                  | Risk |
| --------------- | -------------------------- | ---- |
| XSS             | Angular sanitisation       | Low  |
| Clickjacking    | `X-Frame-Options: DENY`    | None |
| MITM            | HSTS + Cloudflare SSL      | None |
| Tampered assets | SRI on all scripts/styles  | None |
| CV scraping     | Turnstile + signed URLs    | Low  |
| Bad API data    | Valibot schema validation  | Low  |
| DDoS            | Cloudflare edge protection | Low  |
| Leaked secrets  | none in repo               | None |

Attack surface is small. That's good.

## If something breaks

The Worker can be patched fast.
Then I fix the code in the repo and run checks.
