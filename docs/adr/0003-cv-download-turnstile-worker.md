# ADR 0003: CV download through Turnstile and a Worker

**Status:** Accepted · **Decided:** 2025-11-17 (Turnstile client in `67a81f4`); Worker sources in
this repository since [#777](https://github.com/rapaglaz/rapaglaz-portfolio/pull/777) (2026-10-17) ·
**Recorded:** 2026-10-21, retroactively ([#826](https://github.com/rapaglaz/rapaglaz-portfolio/pull/826))

**Context.** The CV must not be a public URL, because bots could download it without any limit.

**Decision.** A click on "CV" runs Cloudflare Turnstile. `turnstile.interceptor` sends the token in
a `cf-turnstile-response` header to the `cv-download` Worker. The Worker checks the origin
allow-list and a per-IP rate limit of 10 requests per minute, validates the token with `siteverify`,
reads the PDF through its R2 binding and streams it with `Cache-Control: private, no-store`.

**Alternatives considered.**

- A public PDF in the static build: everybody can fetch it, and search engines can index it. The
  first docs (`67a81f4`) kept the files in a private R2 bucket.
- reCAPTCHA. The first docs chose Turnstile: no Google tracking, no cookies, faster for the user.
- A signed R2 URL with an expiry of 5 minutes, as described in the first docs. The Worker never
  returned such a URL. It streams the file itself, so there is no link that someone could share.

**Consequences.**

- The production Worker rejects the test token. Since
  [#819](https://github.com/rapaglaz/rapaglaz-portfolio/pull/819), `pnpm start` runs a local copy
  of the Worker with Cloudflare's test secret and a placeholder PDF, so local development sends no
  request to production. E2E mocks Turnstile and `/download`.
- The rate limit works only since [#794](https://github.com/rapaglaz/rapaglaz-portfolio/pull/794).
