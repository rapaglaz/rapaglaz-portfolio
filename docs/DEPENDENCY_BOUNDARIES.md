# Dependency boundaries

Two tools check the imports. Both fail the lint job in CI.

- `@nx/enforce-module-boundaries` (ESLint) checks imports **between projects** through tags. The
  rule is in [`eslint.module-boundaries.mjs`](../eslint.module-boundaries.mjs).
- dependency-cruiser checks rules **inside projects** and cycles. The rules are in
  [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs).

## Between projects (Nx)

Every project has a type tag, and every library also has a scope tag:

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

Data access does not depend on UI. For this reason, the Turnstile modal is in `shared-data-access`,
and the navbar, not the service, shows the toasts.

The router loads `portfolio-feature` with a dynamic import, so Nx rejects every static import of it,
in specs too. The rule cannot distinguish specs from production files, so the app may depend on
`type:testing`. dependency-cruiser makes sure that only specs import `@rapaglaz/shared/testing`.

The root ESLint config and the ESLint config of the Workers share the same block, so the
constraints stay identical. A change of this block runs lint in every project and deploys all three
Workers again on the next `main` run.

## Inside projects (dependency-cruiser)

```bash
pnpm run deps:check   # fails on any error-level rule
pnpm run deps:graph   # HTML matrix in tmp/dependency-cruiser/dependencies.html
```

The check scans `apps/rapaglaz-portfolio/src/app` and `libs/*/*/src`, specs and barrels included.
Type-only imports are ignored (`tsPreCompilationDeps: false`). They cannot create runtime cycles,
but layer violations through type-only imports are not reported either.

- `no-circular`: no runtime cycles, also through barrels.
- `layout-peer-boundary`: the footer and the language switcher import no other layout piece. The
  navbar may use the switcher.
- `no-cross-section`: a section cannot import another section. The page composes them.
- `portfolio-ui-in-feature-only`: only the page imports the section barrel. An import in the shell
  would put every section into the initial bundle.
- `content-is-independent`: the page content imports nothing at runtime.
- `no-production-to-testing`, `no-production-to-specs`: production code imports no test code.
- `no-orphans` (warning): modules without any incoming or outgoing import. It is not a check for
  unused code.

Specs are exempt from the layer rules, because they build and mock collaborators, but not from the
cycle check.

There are no exceptions and no allow-list for cycles. The first version of the rules (#756) had
five narrow exceptions on file level.
They were removed when the layers moved to Nx tags (#807 to #812). The first run, on 2026-10-10,
found 11 warnings, including one cycle. The [engineering notes](./ENGINEERING_NOTES.md) describe
this run.
