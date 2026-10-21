# Security

The site has no login, no stored user data and no payments. It serves mostly static content and one
CV download endpoint.

## Headers

The security headers are set at the Cloudflare edge, not in this repository. A Response Header
Transform Rule (`security-headers`) sets the last four headers with "Set static" on all requests.
The Workers in [`apps/workers/`](../apps/workers/) set only the headers of their own responses.

```http
Strict-Transport-Security: max-age=15768000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

To check the headers that production sends:

```bash
curl -sSI https://rapaglaz.de/en
```

There is no Content-Security-Policy. Angular's `security.autoCsp` option can create a hash-based
policy for the scripts at build time. It covers only scripts, so `style-src` needs a header
([angular.dev](https://angular.dev/best-practices/security), checked 2026-10-21).

## Subresource Integrity

The production build has `subresourceIntegrity: true`. Angular adds `integrity` and `crossorigin`
to every script and style tag, and lists the hashes of the lazy chunks in an import map in the same
HTML. The browser refuses a file that does not match its hash. This does not protect against a
replaced HTML file, because the hashes are part of it.

## CV download

The CV is not a public URL, because bots could download it without any limit. For this reason, the
download goes through Cloudflare Turnstile and a Worker
([ADR 0003](./adr/0003-cv-download-turnstile-worker.md)):

1. The user clicks "CV".
2. Turnstile runs, usually invisibly, sometimes with a challenge.
3. `turnstile.interceptor` sends the token to the Worker in the `cf-turnstile-response` header.
4. The Worker checks the origin allow-list, then a per-IP rate limit of 10 requests per minute
   (`DOWNLOAD_RATE_LIMITER`). The counters are kept per Cloudflare location and are eventually
   consistent, so the limit reduces abuse but is not an exact count. Clients behind one NAT share
   the limit.
5. The Worker validates the token with Cloudflare (`siteverify`).
6. For a valid token, the Worker streams the PDF from R2 with `Cache-Control: private, no-store` and
   `X-Robots-Tag: noindex, noarchive, nofollow`.

The code is in [`apps/workers/cv-download`](../apps/workers/cv-download/). The Cloudflare test
token skips `siteverify` only on a Worker with `ALLOW_TEST_TOKEN=true`, which is meant for
development. Origin and Referer never decide this, because the client sets them.

### Known Turnstile messages in the console

Every CV download shows messages from the Cloudflare iframe (`compact?lang=en` or
`compact?lang=de`) in the browser console. They come from the iframe document on
`challenges.cloudflare.com`. Neither the code nor a CSP header of this site can remove them,
because the same-origin policy isolates the iframe.

The messages are:

- `No available adapters`: Turnstile checks which challenge types are available.
- `Connecting to 'data:,' violates the following Content Security Policy directive: "connect-src ..."`:
  Cloudflare tests `fetch('data:,')` under its own CSP. The widget uses a fallback and works
  normally.
- `Fetch API cannot load data:,' ... violates the document's Content Security Policy`: the same
  test in another form.
- `OTS parsing error: Size of decompressed WOFF 2.0 ...`: a font that Cloudflare serves; the
  message is only cosmetic.

None of them is an error of this code or an unauthorized request. They appear on every download
and can be ignored. To hide them in DevTools, filter the console with `-url:challenges.cloudflare.com`
or `-compact`.

## Input, errors and logging

JSON from the Workers (`/config`, `/feature-flag`) is validated with Valibot before use, and
unexpected shapes are rejected. `/download` returns a blob that goes directly to the browser.

`LoggerService` is the only place that logs. Users see generic messages, never internal details.
Tokens, API keys and personal data are never logged.

## Secrets and dependencies

The repository contains no secrets. They are in GitHub Secrets or in Cloudflare, and
`TURNSTILE_SECRET` is a Worker secret. The Workers deploy from the main workflow with an API token
that can only edit Workers. The deploy secrets are in the `production` environment, which only
`main` can use, so PR workflows never get them.

Renovate updates the dependencies. OSV vulnerability alerts are on, and patch updates merge
automatically.

## Threat model

| Threat          | Mitigation                 |
| --------------- | -------------------------- |
| XSS             | Angular sanitization       |
| Clickjacking    | `X-Frame-Options: DENY`    |
| MITM            | HSTS + Cloudflare SSL      |
| Tampered assets | SRI on all scripts/styles  |
| CV scraping     | Turnstile                  |
| Bad API data    | Valibot schema validation  |
| DDoS            | Cloudflare edge protection |
| Leaked secrets  | none in the repository     |

## Incident response

I fix the running Worker first. Then I fix the code in the repository and run the checks.
