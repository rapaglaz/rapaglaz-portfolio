# Dependency boundaries

Two tools check imports, each at its own level:

- `@nx/enforce-module-boundaries` (ESLint) checks imports **between Nx projects** through
  project tags. The rule lives in [`../eslint.module-boundaries.mjs`](../eslint.module-boundaries.mjs).
- Dependency-cruiser checks the runtime **layers inside the Angular app** and cycles across the
  app and the libraries. The rules live in
  [`../.dependency-cruiser.cjs`](../.dependency-cruiser.cjs).

## Project boundaries (Nx)

Nx forbids importing an application from another project by path. Every project has a type tag,
and libraries also have a scope tag. Each tag has a constraint that lists the tags it may depend
on:

| Tag                | Projects                                            | May depend on                                                              |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `type:app`         | `rapaglaz-portfolio`                                | `type:feature`, `type:data-access`, `type:ui`, `type:util`, `type:testing` |
| `type:feature`     | `portfolio-feature`, `portfolio-layout`             | `type:data-access`, `type:ui`, `type:util`, `type:testing`                 |
| `type:e2e`         | `rapaglaz-portfolio-e2e`                            | `type:app`                                                                 |
| `type:worker`      | `cv-download`, `feature-flag`, `portfolio-settings` | Nothing                                                                    |
| `type:data-access` | `shared-data-access`                                | `type:data-access`, `type:util`, `type:testing`                            |
| `type:ui`          | `shared-ui`, `portfolio-ui`                         | `type:ui`, `type:util`, `type:testing`                                     |
| `type:util`        | `shared-util`                                       | `type:util`                                                                |
| `type:testing`     | `shared-testing`                                    | `type:util`                                                                |
| `scope:shared`     | all `libs/shared/*` libraries                       | `scope:shared`                                                             |
| `scope:portfolio`  | all `libs/portfolio/*` libraries                    | `scope:portfolio`, `scope:shared`                                          |

Data access does not depend on UI: the Turnstile modal belongs to `shared-data-access`, and the
navbar connects the CV download to the toasts.

The router loads `portfolio-feature` with a dynamic import, so Nx treats it as lazy-loaded and
rejects every static import of it, specs included; `app.routes.spec.ts` imports it dynamically.

The e2e project tests the app through `implicitDependencies`, not through imports. A new library
gets a type and a scope tag, and the constraints are extended to say which projects may use it.

The app may use `type:testing` because the rule does not know specs from production files;
dependency-cruiser checks that only specs import `@rapaglaz/shared/testing`. Specs in
`shared-util` cannot use it at all: `shared-testing` imports `shared-util`, and Nx sees the import
in a spec as a project dependency, so it would be a cycle.

The rule runs through `pnpm run lint`. The root config and the Workers config
(`apps/workers/eslint.config.mjs`, which does not extend the root config) both use the shared
block, so the constraints cannot drift apart.

The shared file is a lint cache input for every project: through `lintGlobals` for the app and e2e,
and through the `workerLint` named input for the Workers, which also lists `@nx/eslint-plugin` as
an external dependency. A change to it reruns lint everywhere and marks all three Workers as
affected, so the next `main` run redeploys them.

The rule treats files that belong to no project as external resources. Two cases are handled
explicitly:

- `eslint.config.mjs` files are excluded: the project configs extend the root config, which
  belongs to no project.
- The Workers config allows the exact import `../testing/wrangler-config.js`, the shared spec
  helper in `apps/workers/testing/`.

Two temporary probes made lint fail with a boundary error: a Worker importing another Worker,
and an e2e spec importing app source.

## Layer boundaries (dependency-cruiser)

### Commands and scope

```bash
pnpm run deps:check   # pnpm nx deps-check rapaglaz-portfolio
pnpm run deps:graph   # pnpm nx deps-graph rapaglaz-portfolio
```

Both scripts run Nx targets of `rapaglaz-portfolio`, cached in the local and remote Nx cache. The
cache key includes the project files, `.dependency-cruiser.cjs`, `tsconfig.base.json`, and the
installed dependency-cruiser version.

`deps:check` scans every supported module under `apps/rapaglaz-portfolio/src/app` and
`libs/*/*/src`, including specs and barrel exports. The layer rules are for the app; the cycle,
spec, testing and orphan rules also cover the libraries, whose sources are in the cache key
(`^default`).
It exits non-zero for error-severity violations. All boundary and cycle rules are errors;
`no-orphans` remains a warning. Both GitHub Actions workflows run this command through the
shared quality-check action's lint mode.

`deps:graph` writes an HTML dependency matrix to `tmp/dependency-cruiser/dependencies.html`.
It creates the directory automatically. The existing `/tmp` Git ignore covers this output.
The matrix works without GraphViz; it is not a node-and-edge SVG graph.

Resolution uses `apps/rapaglaz-portfolio/tsconfig.app.json`, passed as an absolute path: with a
relative one, TypeScript resolves the tsconfig `extends` chain against that path a second time.
The graph is restricted to `apps/rapaglaz-portfolio/src/app` and `libs/*/*/src`, with
`node_modules`, `dist`, and `coverage` excluded; library imports resolve to source through the
aliases in `tsconfig.base.json`. Imports outside it, including external packages, are outside these layer
checks. Dynamic imports and runtime re-exports are included.

`tsPreCompilationDeps: false` excludes type-only and other imports erased during compilation.
They cannot create runtime initialization cycles. This setting applies to every rule, so it
also excludes type-only layer violations. See the
[dependency-cruiser option reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md#tsprecompilationdeps).

`no-orphans` means modules without incoming or outgoing dependencies in the scoped graph;
it is not a complete unused-code analysis. Entry points (`main.ts`, `main.server.ts`), app
configs/routes, library entry points and test setups, specs, and E2E files are excluded from
orphan warnings. The main entry points
and the e2e project already fall outside the scanned folder.

Paths in the rest of this document are relative to `apps/rapaglaz-portfolio/`.

### Rules inside the libraries

The app has only the bootstrap; what it may import from libraries is decided by the project tags.
Inside the libraries, dependency-cruiser adds four rules:

- `layout-peer-boundary`: in `libs/portfolio/layout` the footer and the language switcher do not
  import other layout pieces; the navbar may use the language switcher.

- `no-cross-section`: a section in `libs/portfolio/ui` cannot import another section; the page
  composes them.
- `portfolio-ui-in-feature-only`: only `portfolio-feature` and specs may import the section barrel.
  It re-exports every section, so an import from the root component would put all sections into
  the initial bundle although the router lazy-loads the page.
- `content-is-independent`: the content in `libs/portfolio/feature/src/lib/content` imports nothing
  at runtime; the input types it uses are type-only imports.

Specs are exempt from layer rules because they need to construct and mock collaborators.
They remain in cycle analysis. Production files cannot import `*.spec.ts` files or
`@rapaglaz/shared/testing`.

### Narrow exceptions

There are none left. The routing exception went away when the page moved to `portfolio-feature`:
the Nx lazy-load rule now keeps everything but the router from importing it.

There is no cycle allow-list. The missing handler (logger) and portfolio shell (SEO language
constants) exceptions went away when logger and i18n moved to `shared-util`; the toast and
Turnstile overlay exceptions went away when each service moved into one library with its UI.

### Initial report and enforcement

On 2026-10-08 the first check ran with every rule set to `warn` and reported 11 warnings across
81 modules: one cycle (the missing handler importing the services barrel) and ten layer
violations. The cycle was fixed with the direct logger import, specs were exempted from layer
rules, and the remaining cases became the exceptions above. Two temporary probes, a cross-feature
import and a cycle, then made `pnpm run deps:check` exit `1`. The full report and the probe results
are in the [version of this file from #756](https://github.com/rapaglaz/rapaglaz-portfolio/blob/9a18c770e44f30c59ffd2c1734dc3a9bbbc1aa33/docs/DEPENDENCY_BOUNDARIES.md#initial-report-and-decisions).
