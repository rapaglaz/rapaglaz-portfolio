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
The browser refuses a script or stylesheet that does not match the hash in the HTML.
It does not help if the HTML itself is replaced, because the hashes live there.

## CV download protection

I don't want the CV to be a public URL that bots can scrape forever.
Downloads go through Cloudflare Turnstile + a Worker.

Flow:

1. User clicks "CV"
2. Turnstile runs (sometimes invisible, sometimes it asks)
3. Frontend sends the token to the Worker (via `cf-turnstile-response` header, injected by `turnstile.interceptor`)
4. Worker checks the origin allow-list and a per-IP rate limit (10 requests per minute, stored in KV)
5. Worker validates the token against Cloudflare (`siteverify`)
6. If ok, Worker streams the PDF from R2 with `Cache-Control: private, no-store` and
   `X-Robots-Tag: noindex, noarchive, nofollow`

## Input validation

JSON responses from Cloudflare Workers (`/config`, `/feature-flag`) are validated with Valibot before use.
`/download` returns the PDF as a blob, which is handed straight to the browser download.
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
| CV scraping     | Turnstile + rate limit     | Low  |
| Bad API data    | Valibot schema validation  | Low  |
| DDoS            | Cloudflare edge protection | Low  |
| Leaked secrets  | none in repo               | None |

Attack surface is small. That's good.

## If something breaks

The Worker can be patched fast.
Then I fix the code in the repo and run checks.
