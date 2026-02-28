# Architecture

This app is small, so I keep the structure boring and predictable.
No framework on top of framework. Just Angular.

## Folder layout

I organise by feature, not by layers inside every folder.
Shared bits go to a shared place.

```plaintext
src/
├── app/           # bootstrap + routing + top-level view
├── features/      # hero, navbar, contact, etc
├── ui/            # small reusable presentational pieces
├── services/      # shared logic (cv download, toast, config, turnstile)
├── utils/         # helpers (i18n, rxjs, scroll, animation)
└── content/       # typed static content
```

I try to keep features isolated (no feature → feature imports). One exception:
navbar uses the language switcher. It is fine, but it is a conscious choice.

## Angular style

### Standalone + OnPush + signals + zoneless

Everything is standalone. Most components are presentational, so `OnPush` is the default.
If something needs state, I keep it close to the feature or in a service.

Signals are used for small UI state. RxJS stays for async work (HTTP, events, Turnstile).
`zone.js` is not in dependencies, so updates are explicit.

### SSG + hydration

Production build is static (`outputMode: static`). Angular pre-renders and outputs HTML.
On the client side it hydrates, so it does not repaint the whole page.

## State and services

Most sections have no real business logic. The interesting parts are the services.

- CV download: fetch config, get a Turnstile token, call the backend, trigger browser download
- Turnstile: loads the script once, renders the widget in a modal, cleans up after itself
- Toasts: CDK overlay with explicit cleanup
- Feature flag: reads `openToWork` from a Cloudflare Worker backed by KV

## Feature flag (Open to Work)

Runtime toggle for the navbar badge. It is a single public flag, not a full system.

- `GET https://rapaglaz.de/feature-flag/openToWork` → `{ "openToWork": true | false }`
- A `404` response is treated as `false`
- Storage is Cloudflare KV, updated manually

## Testing approach

### Unit tests

Unit tests run via Angular’s unit-test builder with the Vitest runner.

For presentational sections I keep tests as smoke checks (renders, key elements exist).
For services/interceptors I test behaviour and error paths.

### E2E (Playwright)

Playwright is used for user flows:

- language switch
- CV download (mocked backend)
- Turnstile failure cases (script blocked / verification fails)
- a11y check with axe on initial load

In CI (and in `e2e:ssg`) tests run against the static build served on port 4233.
Locally `pnpm run e2e` uses the dev server on 4200.

### Lighthouse CI

Lighthouse is feedback only. It does not block merges.
Config is in `.lighthouserc.cjs` and uses `pnpm run preview` (port 4233).

## i18n

Transloco with JSON under `public/i18n`.
Runtime has a strict missing handler, so missing keys are loud.
Routes are `/en` and `/de`. The URL segment decides the active language.
Root `/` falls back to the default language (`en`).

I validate translations with:

```bash
pnpm run i18n:check
```

## Trade-offs

- No NgRx. Not needed here.
