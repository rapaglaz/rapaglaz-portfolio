# Architecture

This app is small, so I keep the structure boring and predictable.
No framework on top of framework. Just Angular.

## Folder layout

I organise by feature, not by layers inside every folder.
Shared bits go to a shared place.

```plaintext
src/app/
├── app.ts / app.config.ts / app.routes.ts   # bootstrap, routing, providers
├── portfolio/     # top-level portfolio shell component
├── features/      # hero, navbar, about, skills, certifications, contact, footer
├── ui/            # small reusable presentational pieces (badge, section-wrapper, toast-container, turnstile-modal)
├── services/      # shared logic (cv-download, feature-flag, turnstile, toast, config, logger)
├── interceptors/  # HTTP interceptors (turnstile token injection)
├── utils/         # helpers (i18n, rxjs, scroll, animation, layout, tokens)
├── content/       # typed static content (skills, certifications, contact)
└── testing/       # shared test helpers (transloco loader, window mocks)
```

I try to keep features isolated (no feature → feature imports). One exception:
navbar uses the language switcher. It is fine, but it is a conscious choice.

Dependency-cruiser enforces the runtime layer boundaries and rejects circular imports.
See [Dependency boundaries](./DEPENDENCY_BOUNDARIES.md) for the allowed dependencies,
documented exceptions, commands, and the initial report-only rollout.

## Angular style

### Standalone + OnPush + signals + zoneless

Everything is standalone. Most components are presentational, so `OnPush` is the default.
If something needs state, I keep it close to the feature or in a service.

Signals are used for small UI state. RxJS stays for async work (HTTP, events, Turnstile).
The feature flag is the one exception — it uses `httpResource`, so the value arrives
as a signal already and there is no manual subscribe anywhere.
`zone.js` is not in dependencies, so updates are explicit.

DOM measuring lives in directives, not components. Scroll reveal was already a directive,
and the navbar height (`--navbar-height` CSS variable via ResizeObserver) moved into
`MeasureNavbarHeightDirective` in `utils/layout` to follow the same pattern.
The navbar component keeps only state and actions.

### SSG + hydration

Production build is static (`outputMode: static`). Angular pre-renders and outputs HTML.
On the client side it hydrates, so it does not repaint the whole page.

### Routing + lazy loading

All routes (`/`, `/en`, `/de`) use `loadComponent` to lazy-load the `Portfolio` shell.
There is one component entry point; the URL segment only determines the active language.

## State and services

Most sections have no real business logic. The interesting parts are in services:

- CV download: get config → get Turnstile token → call backend endpoint → trigger browser download
- Turnstile: load the script once and render the widget in the active `en` or `de` locale. Interactive verification uses CDK Dialog with a labelled modal, a backdrop, focus trapping, and focus restoration to the CV button. Explicit focus-region boundaries surround the iframe for WebKit keyboard navigation. Closing, cancelling, Escape, or backdrop activation completes verification without a token or download; errors retain the existing error toast.
- Toasts: CDK overlay, explicit cleanup
- Feature flag: read `openToWork` from a Cloudflare Worker + KV, exposed as `httpResource`
- Config: fetched once per app life, `retry({ count: 3 })` + `shareReplay`, no manual retry counter
- Logger: centralised logging service, does not expose internal details to users

HTTP interceptors handle cross-cutting concerns:

- `turnstile.interceptor`: injects `X-Turnstile-Token` header via `HttpContext`

## Feature flag (Open to Work)

Runtime toggle for the navbar badge. It is a single public flag, not a full system.

- `GET https://rapaglaz.de/feature-flag/openToWork` → `{ "openToWork": true | false }`
- Missing flag returns `404`, frontend treats it as `false`
- Storage is Cloudflare KV, updated manually

On the frontend it is one `httpResource` per flag name, cached in a plain Map.
The old version had a dual Observable + Signal API with two LRU caches — way too much
machinery for a single flag, so it is gone. Validation happens in the resource `parse`
option (Valibot), anything unexpected becomes `false`. On the server the resource URL
is `undefined`, so no request fires during prerender.

One gotcha: `value()` throws in the error state even when `defaultValue` is set.
Components read the flag through `hasValue()` inside a computed instead.

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
Runs directly via the `lighthouse` CLI (see `.github/actions/lighthouse/report`) against `pnpm run preview` (port 4233), 3 runs with the median performance score picked.

## i18n

Transloco with JSON under `public/i18n`.
Runtime has a strict missing handler, so missing keys are loud.
Routes are `/en` and `/de`. The URL segment decides the active language.
Root `/` falls back to the default language (`en`).

The app initializer loads the initial translations for SSR and hydration. A route resolver
then loads and activates the URL's language and updates `<html lang>` before creating the
portfolio, including on Back/Forward navigation. The language switcher only navigates and
preserves query parameters and the fragment; its selection follows the resolved language.
If German translations fail to load, the resolver redirects to `/en` with the same URL extras
and replaces the failed history entry. If English cannot be loaded, navigation is cancelled
and the current route and language remain active.

I validate translations with:

```bash
pnpm run i18n:check
```

## Trade-offs

- No NgRx. Not needed here.
