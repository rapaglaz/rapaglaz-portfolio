# Dependency boundaries

Two tools check imports. Both fail the lint job in CI.

- `@nx/enforce-module-boundaries` (ESLint) checks imports **between projects** through tags. The
  rule is in [`eslint.module-boundaries.mjs`](../eslint.module-boundaries.mjs).
- dependency-cruiser checks rules **inside projects** and cycles. The rules are in
  [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs).

## Between projects (Nx)

Every project has a type tag, and libraries also have a scope tag:

| Tag                | Projects                                            | May depend on                                                              |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `type:app`         | `rapaglaz-portfolio`                                | `type:feature`, `type:data-access`, `type:ui`, `type:util`, `type:testing` |
| `type:feature`     | `portfolio-feature`, `portfolio-layout`             | `type:data-access`, `type:ui`, `type:util`, `type:testing`                 |
| `type:e2e`         | `rapaglaz-portfolio-e2e`                            | `type:app`                                                                 |
| `type:worker`      | `cv-download`, `feature-flag`, `portfolio-settings` | Nothing                                                                    |
| `type:data-access` | `shared-data-access`                                | `type:data-access`, `type:util`, `type:testing`                            |
| `type:ui`          | `shared-ui`, `portfolio-ui`                         | `type:ui`, `type:util`, `type:testing`                                     |
| `type:util`        | `shared-util`, `portfolio-util`                     | `type:util`                                                                |
| `type:testing`     | `shared-testing`                                    | `type:util`                                                                |
| `scope:shared`     | all `libs/shared/*` libraries                       | `scope:shared`                                                             |
| `scope:portfolio`  | all `libs/portfolio/*` libraries                    | `scope:portfolio`, `scope:shared`                                          |

Data access does not depend on UI. That is why the Turnstile modal is in `shared-data-access`, and
why the navbar, not the service, shows the toasts.

The router loads `portfolio-feature` with a dynamic import, so Nx rejects every static import of it,
specs included. The rule cannot tell specs from production files, so the app may use `type:testing`.
dependency-cruiser makes sure that only specs import `@rapaglaz/shared/testing`.

The root and the Workers ESLint configs share the same block, so the constraints cannot drift apart.
A change to it runs lint everywhere and redeploys all three Workers on the next `main` run.

## Inside projects (dependency-cruiser)

```bash
pnpm run deps:check   # fails on any error-level rule
pnpm run deps:graph   # HTML matrix in tmp/dependency-cruiser/dependencies.html
```

It scans `apps/rapaglaz-portfolio/src/app` and `libs/*/*/src`, specs and barrels included.
Type-only imports are ignored (`tsPreCompilationDeps: false`). They cannot make runtime cycles, but
type-only layer violations are not reported either.

- `no-circular`: no runtime cycles, also through barrels.
- `layout-peer-boundary`: the footer and the language switcher import no other layout piece. The
  navbar may use the switcher.
- `no-cross-section`: a section cannot import another section. The page composes them.
- `portfolio-ui-in-feature-only`: only the page imports the section barrel. If the shell imported
  it, every section would be in the initial bundle.
- `content-is-independent`: the page content imports nothing at runtime.
- `no-production-to-testing`, `no-production-to-specs`: production code imports no test code.
- `no-orphans` (warning): modules without any import in or out. It is not an unused-code check.

Specs are exempt from the layer rules, because they build and mock collaborators, but not from the
cycle check.

There are no exceptions and no cycle allow-list. The first version of the rules (#756) had five
narrow file-level exceptions. They were removed when the layers moved to Nx tags (#807 to #812). The
first run, on 2026-10-10, found 11 warnings including one cycle. The
[engineering notes](./ENGINEERING_NOTES.md) tell that story.
