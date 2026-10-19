# Dependency boundaries

Two tools check imports, each at its own level:

- `@nx/enforce-module-boundaries` (ESLint) checks imports **between Nx projects** through
  project tags. The rule lives in [`../eslint.module-boundaries.mjs`](../eslint.module-boundaries.mjs).
- Dependency-cruiser checks the runtime **layers inside the Angular app**. The rules live in
  [`../.dependency-cruiser.cjs`](../.dependency-cruiser.cjs).

## Project boundaries (Nx)

The workspace has only applications, and Nx forbids importing an application from another
project by path. Each project tag has a constraint that lists the tags it may depend on:

| Tag           | Projects                                            | May depend on |
| ------------- | --------------------------------------------------- | ------------- |
| `type:app`    | `rapaglaz-portfolio`                                | Nothing       |
| `type:e2e`    | `rapaglaz-portfolio-e2e`                            | `type:app`    |
| `type:worker` | `cv-download`, `feature-flag`, `portfolio-settings` | Nothing       |

The e2e project tests the app through `implicitDependencies`, not through imports. A new library
gets a tag, and the constraints are extended to say which projects may use it.

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

`deps:check` scans every supported module under `apps/rapaglaz-portfolio/src/app`, including
specs and barrel exports.
It exits non-zero for error-severity violations. All boundary and cycle rules are errors;
`no-orphans` remains a warning. Both GitHub Actions workflows run this command through the
shared quality-check action's lint mode.

`deps:graph` writes an HTML dependency matrix to `tmp/dependency-cruiser/dependencies.html`.
It creates the directory automatically. The existing `/tmp` Git ignore covers this output.
The matrix works without GraphViz; it is not a node-and-edge SVG graph.

Resolution uses `apps/rapaglaz-portfolio/tsconfig.app.json`, passed as an absolute path: with a
relative one, TypeScript resolves the tsconfig `extends` chain against that path a second time.
The graph is restricted to `apps/rapaglaz-portfolio/src/app`, with `node_modules`, `dist`, and
`coverage` excluded. Imports outside it, including external packages, are outside these layer
checks. Dynamic imports and runtime re-exports are included.

`tsPreCompilationDeps: false` excludes type-only and other imports erased during compilation.
They cannot create runtime initialization cycles. This setting applies to every rule, so it
also excludes type-only layer violations. See the
[dependency-cruiser option reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md#tsprecompilationdeps).

`no-orphans` means modules without incoming or outgoing dependencies in the scoped graph;
it is not a complete unused-code analysis. Entry points (`main.ts`, `main.server.ts`), app
configs/routes, specs, and E2E files are excluded from orphan warnings. The main entry points
and the e2e project already fall outside the scanned folder.

Paths in the rest of this document are relative to `apps/rapaglaz-portfolio/`.

### Layer rules

Imports within the same layer are allowed. The table describes additional application-layer
dependencies before the narrow exceptions below.

| Source layer   | Additional allowed targets                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `content`      | None; content may compose other content and re-export it through its barrel.                    |
| `utils`        | `content`; no features, UI, services, interceptors, or portfolio.                               |
| `ui`           | `utils`                                                                                         |
| `services`     | `utils`, `content`                                                                              |
| `interceptors` | `services`, `utils`                                                                             |
| `features`     | `ui`, `services`, `utils`, `content`                                                            |
| `portfolio`    | `features`, `ui`                                                                                |
| `testing`      | May use application modules for test support. Only specs and other testing files may import it. |

Features cannot import another feature or the shared `features/index.ts` barrel. The one
peer exception is `features/navbar` importing `features/language-switcher`. The root feature
barrel may re-export features so that the portfolio shell can compose them. Only the portfolio
layer and specs may import that barrel: it re-exports every section, so an import from the root
component put all sections into the initial bundle although the router lazy-loads the shell.

Specs are exempt from layer rules because they need to construct and mock collaborators.
They remain in cycle analysis. Production files cannot import `*.spec.ts` files or `testing`.
Files outside the portfolio layer cannot import portfolio, except for specs and the route
entry point listed below.

### Narrow exceptions

Every exception has a comment in the configuration. The specialized rules keep all other
forbidden targets checked for the source files that need an exception.

| Source                                            | Additional allowed target                   | Reason                                                                                        |
| ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/app/utils/i18n/transloco-missing-handler.ts` | `src/app/services/logger/logger.service.ts` | Missing keys must use the central logger. The direct import avoids the services barrel cycle. |
| `src/app/services/toast/toast.service.ts`         | `src/app/ui/index.ts`                       | The service owns the CDK overlay lifecycle and instantiates the toast UI.                     |
| `src/app/services/turnstile/turnstile.service.ts` | `src/app/ui/index.ts`                       | The service owns the CDK overlay lifecycle and instantiates the Turnstile modal.              |
| `src/app/portfolio/portfolio.ts`                  | `src/app/utils/i18n/index.ts`               | Shared language constants drive canonical and alternate SEO links.                            |
| `src/app/app.routes.ts`                           | The `portfolio` layer                       | The router must lazy-load the portfolio shell.                                                |

There is no cycle allow-list. Importing the central logger directly fixes the original cycle
without changing the missing handler's behavior or moving files.

### Initial report and enforcement

On 2026-10-08 the first check ran with every rule set to `warn` and reported 11 warnings across
81 modules: one cycle (the missing handler importing the services barrel) and ten layer
violations. The cycle was fixed with the direct logger import, specs were exempted from layer
rules, and the remaining cases became the exceptions above. Two temporary probes, a cross-feature
import and a cycle, then made `pnpm run deps:check` exit `1`. The full report and the probe results
are in the [version of this file from #756](https://github.com/rapaglaz/rapaglaz-portfolio/blob/9a18c770e44f30c59ffd2c1734dc3a9bbbc1aa33/docs/DEPENDENCY_BOUNDARIES.md#initial-report-and-decisions).
