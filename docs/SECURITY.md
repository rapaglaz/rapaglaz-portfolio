# Security

There is no login, no user data storage, no payments.
It's mostly static content + a CV download endpoint.

## Headers

I set basic security headers at the Cloudflare edge. They are configured there, not in this
repository; the Workers in [`workers/`](../workers/) set only their own response headers.

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

There is no Content-Security-Policy header. Angular's `security.autoCsp` build option could generate
a hash-based one, but it is still experimental.

## Subresource Integrity (SRI)

The production build has `subresourceIntegrity: true` in `angular.json`.
Angular injects `integrity` and `crossorigin` attributes on all script and style tags, and lists
the hashes of lazy-loaded chunks in an import map (`<script type="importmap">`) in the same HTML.
The browser refuses a script or stylesheet that does not match the hash in the HTML.
It does not help if the HTML itself is replaced, because the hashes live there.

## CV download protection

I don't want the CV to be a public URL that bots can scrape forever.
Downloads go through Cloudflare Turnstile + a Worker.

Flow:

1. User clicks "CV"
2. Turnstile runs (sometimes invisible, sometimes it asks)
3. Frontend sends the token to the Worker (via `cf-turnstile-response` header, injected by `turnstile.interceptor`)
4. Worker checks the origin allow-list. Its per-IP rate limit (10 requests per minute in KV) only runs
   with a `RATE_LIMIT_STORE` binding, and production has none
5. Worker validates the token against Cloudflare (`siteverify`)
6. If ok, Worker streams the PDF from R2 with `Cache-Control: private, no-store` and
   `X-Robots-Tag: noindex, noarchive, nofollow`

The code is in [`workers/cv-download`](../workers/cv-download/). Cloudflare's test token skips
`siteverify` only on a Worker with `ALLOW_TEST_TOKEN=true`, which is meant for development.
Origin and Referer never decide that, because the client sets them.

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
`TURNSTILE_SECRET` is a Worker secret in Cloudflare. The Workers deploy from the main branch
workflow with a Cloudflare API token limited to editing Workers; pull request workflows never get it.

Renovate handles dependency updates.
OSV vulnerability alerts are enabled with automatic patch automerge.

## Threat model (simple)

| Threat          | What I do                  | Risk |
| --------------- | -------------------------- | ---- |
| XSS             | Angular sanitisation       | Low  |
| Clickjacking    | `X-Frame-Options: DENY`    | Low  |
| MITM            | HSTS + Cloudflare SSL      | Low  |
| Tampered assets | SRI on all scripts/styles  | Low  |
| CV scraping     | Turnstile                  | Low  |
| Bad API data    | Valibot schema validation  | Low  |
| DDoS            | Cloudflare edge protection | Low  |
| Leaked secrets  | none in repo               | Low  |

## If something breaks

The Worker can be patched fast.
Then I fix the code in the repo and run checks.
