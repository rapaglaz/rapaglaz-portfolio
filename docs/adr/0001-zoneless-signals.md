# ADR 0001: Zoneless change detection with signals

**Status:** Accepted · **Date:** 2025-11-17 (initial commit `67a81f4`)

## Context

Most sections are presentational and have no real business logic. The stateful parts are small UI
state and async work: HTTP, browser events and the Turnstile widget.

## Decision

- `zone.js` is not a dependency, so updates are explicit. The initial commit called
  `provideZonelessChangeDetection()`; #38 (2025-11-27) removed that call from config and specs.
- Standalone components, `OnPush` by default. Signals for UI state, RxJS for async work; the
  feature flag uses `httpResource`, so its value arrives as a signal with no manual subscribe.

## Alternatives considered

<!-- TODO(Paul): Which alternative did you consider, and why did you reject it? -->

## Consequences

- DOM measuring lives in directives (scroll reveal, `MeasureNavbarHeightDirective`).
- `httpResource.value()` throws in the error state even with `defaultValue`, so components read the
  flag through `hasValue()` inside a `computed`.
