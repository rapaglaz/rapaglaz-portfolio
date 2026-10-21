# ADR 0001: Zoneless change detection and signals

**Status:** Accepted, recorded on 2026-10-19 · **Date:** 2025-11-17 (initial commit `67a81f4`)

**Context.** A small bilingual page: static content, a CV download, a toast and one feature flag.
Most components only show their inputs.

**Decision.** No `zone.js`; it was never a dependency. `app.config.ts` had
`provideZonelessChangeDetection()` until [#38](https://github.com/rapaglaz/rapaglaz-portfolio/pull/38)
removed it on 2025-11-27 (Angular 21, where zoneless is the default,
[angular.dev](https://angular.dev/guide/zoneless), checked 2026-10-19). Components are standalone and
`OnPush`. Signals hold UI state and RxJS handles async work. The feature flag is an `httpResource`.

**Alternatives considered.** Change detection with zone.js, the Angular default until version 20.
The first `ARCHITECTURE.md` (`67a81f4`) gave three reasons against it: no zone patching overhead, a
clearer model of when the view updates, and zone.js "getting deprecated anyway".

**Consequences.**

- Updates are explicit; nothing renders because a zone noticed an async task.
- Unit tests run in a zoneless TestBed that AnalogJS sets up (`src/test-setup.ts` in every project).
- `value()` of the flag resource throws in the error state even with `defaultValue`, so components
  read the flag through `hasValue()` inside a `computed`.
