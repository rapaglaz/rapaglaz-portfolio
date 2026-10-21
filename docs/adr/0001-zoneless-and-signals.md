# ADR 0001: Zoneless change detection and signals

**Status:** Accepted, recorded on 2026-10-19 · **Date:** 2025-11-17 (initial commit `67a81f4`)

**Context.** A small bilingual page: static content, a CV download, a toast and one feature flag.
Most components are presentational.

**Decision.** `provideZonelessChangeDetection()` since the first commit; `zone.js` was never a
dependency. Components are standalone and `OnPush`. Signals hold UI state, RxJS handles async work
(HTTP, events, Turnstile). The feature flag is an `httpResource`, so its value arrives as a signal
and nothing subscribes manually.

**Alternatives considered.**

<!-- TODO(Paul): Which alternative did you consider, and why did you reject it? -->

**Consequences.**

- Updates are explicit; nothing renders because a zone noticed an async task.
- Unit tests run in a zoneless TestBed that AnalogJS sets up (`src/test-setup.ts` in every project).
- `value()` of the flag resource throws in the error state even with `defaultValue`, so components
  read the flag through `hasValue()` inside a `computed`.
