# Security

No login, no stored user data, no payments. Mostly static content and a CV download endpoint.

## Headers

Security headers are set at the Cloudflare edge, not in this repo. A Response Header Transform Rule
(`security-headers`) sets the last four with "Set static" on all requests. The Workers in
[`apps/workers/`](../apps/workers/) set only their own response headers.

```http
Strict-Transport-Security: max-age=15768000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

There is no Content-Security-Policy. Angular's `security.autoCsp` could make a hash-based one, but
it is still experimental.

## Subresource Integrity

The production build has `subresourceIntegrity: true`. Angular adds `integrity` and `crossorigin`
to every script and style tag, and lists the hashes of lazy chunks in an import map in the same
HTML. The browser refuses a file that does not match. It does not help if the HTML itself is
replaced, because the hashes are in it.

## CV download

I don't want the CV to be a public URL that bots can scrape forever, so downloads go through
Cloudflare Turnstile and a Worker ([ADR 0003](./adr/0003-cv-download-turnstile-worker.md)):

1. The user clicks "CV".
2. Turnstile runs, usually invisibly, sometimes with a challenge.
3. `turnstile.interceptor` sends the token to the Worker in the `cf-turnstile-response` header.
4. The Worker checks the origin allow-list, then a per-IP rate limit of 10 requests per minute
   (`DOWNLOAD_RATE_LIMITER`). Counters are kept per Cloudflare location and are eventually
   consistent, so this limits abuse but is not an exact count. Clients behind one NAT share the
   limit.
5. The Worker validates the token with Cloudflare (`siteverify`).
6. If the token is valid, the Worker streams the PDF from R2 with `Cache-Control: private, no-store`
   and `X-Robots-Tag: noindex, noarchive, nofollow`.

The code is in [`apps/workers/cv-download`](../apps/workers/cv-download/). The test token of
Cloudflare skips `siteverify` only on a Worker with `ALLOW_TEST_TOKEN=true`, which is meant for
development. Origin and Referer never decide that, because the client sets them.

## Input, errors and logging

JSON from the Workers (`/config`, `/feature-flag`) is validated with Valibot before use, and
unexpected shapes are rejected. `/download` returns a blob that goes straight to the browser.

`LoggerService` is the only place that logs. Users see generic messages, never internal details.
Tokens, API keys and personal data are never logged.

## Secrets and dependencies

No secrets in the repo. They are in GitHub Secrets or in Cloudflare, and `TURNSTILE_SECRET` is a
Worker secret. The Workers deploy from the main workflow with an API token that can only edit
Workers. PR workflows never get it.

Renovate updates the dependencies. OSV vulnerability alerts are on, and patch updates merge
automatically.

## Threat model

| Threat          | What I do                  |
| --------------- | -------------------------- |
| XSS             | Angular sanitization       |
| Clickjacking    | `X-Frame-Options: DENY`    |
| MITM            | HSTS + Cloudflare SSL      |
| Tampered assets | SRI on all scripts/styles  |
| CV scraping     | Turnstile                  |
| Bad API data    | Valibot schema validation  |
| DDoS            | Cloudflare edge protection |
| Leaked secrets  | none in repo               |

## If something breaks

I patch the Worker first, then fix the code in the repo and run the checks.
