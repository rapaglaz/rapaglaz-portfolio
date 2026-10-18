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
├── features/      # hero, navbar, language-switcher, about, skills, languages, certifications, contact, footer
├── ui/            # small reusable presentational pieces (badge, section-wrapper, toast-container, turnstile-modal)
├── services/      # shared logic (cv-download, feature-flag, turnstile, toast, config, logger)
├── interceptors/  # HTTP interceptors (turnstile token injection)
├── utils/         # helpers (i18n, rxjs, scroll, animation, layout, tokens, contact)
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
- Turnstile: load the script once and render the widget in the active `en` or `de` locale. An interactive challenge opens in a CDK Dialog with a focus trap and focus restored to the CV button. WebKit needs explicit focus-region boundaries around the iframe for keyboard navigation. Any way of closing the dialog ends verification without a token or download. The CDK Dialog chunk loads next to the Turnstile script after the CV click, and the widget renders once both are ready.
- Toasts: a single CDK overlay updated in place. Errors use `role="alert"`, success and info `role="status"`; the close action stays outside the live region. Toasts stay until dismissed and do not move focus when they open. The CDK overlay and portal load with the first toast, so `show()` returns a promise that resolves once the toast is rendered.
- Feature flag: read `openToWork` from a Cloudflare Worker + KV, exposed as `httpResource`
- Config: fetched once per app life with `shareReplay`. Network errors and 5xx responses are retried up to 3 times (250 ms, 500 ms, 1 s apart); a 4xx or an invalid body fails at once. If the request fails, the cached observable is dropped so the next call fetches again
- Logger: centralised logging service, does not expose internal details to users

A timeout is only for messages whose information is available elsewhere. Focus and hover pause it.

HTTP interceptors handle cross-cutting concerns:

- `turnstile.interceptor`: injects the `cf-turnstile-response` header via `HttpContext`

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
- a11y checks with axe after EN/DE content is revealed in light and dark themes

The contrast tests also read browser-computed theme pairs and interaction colors. Text requires
4.5:1 contrast; icons and authored focus indicators require 3:1. Navbar and toast backgrounds
are opaque so the content beneath them cannot lower contrast. Decorative borders and shadows
are not treated as essential controls. These checks run after finite animations finish.

Entrance animations, deliberate delays, and hover decoration remain enabled with
`prefers-reduced-motion: no-preference`. With `reduce`, CSS disables entrance animations, delays,
transitions, smooth scrolling, and hover scaling; scroll-reveal content is visible even before
an intersection occurs. Motion E2E checks cover both preferences and changes after page load.
The CV loading dots and the verification spinner keep DaisyUI's standard animations; with reduce
they run slower instead of stopping, and the busy state and loading label stay available.
Contact cards lift on keyboard focus or fine-pointer hover; with reduce they keep the border and
shadow feedback without movement.
The hero name is an outline over a light fill. `paint-order: stroke fill` hides the overlapping
glyph contours inside letters, and the stroke keeps at least 5.9:1 contrast in both themes.

Keyboard focus bypasses entrance effects in either mode. Scroll reveal marks the focused
element and its ancestors so animated content stays visible after focus leaves, while other
items keep their entrance effects. Navbar and toast focus also bypass their entrance delay.

In CI (and in `e2e:ssg`) tests run against the static build served on port 4233.
Locally `pnpm run e2e` uses the dev server on 4200.

### Lighthouse CI

Lighthouse is feedback only. It does not block merges.
See [CI/CD strategy](./CI_STRATEGY.md#lighthouse) for how it runs and why it uses the CLI directly.

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

Bootstrap failure messages are bundled from the JSON dictionaries, so they still appear in the
URL's language when Angular, Transloco, or translation requests fail.
The server translation loader is imported directly by the server configuration, keeping
full translation dictionaries out of the browser JavaScript bundle.
Certification dates use `Intl.DateTimeFormat` with the active language.

I validate translations with:

```bash
pnpm run i18n:check
```

## Trade-offs

- No NgRx. Not needed here.
