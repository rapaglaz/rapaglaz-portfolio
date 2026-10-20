// Runtime rules inside the app and inside libraries. Boundaries between Nx projects are enforced
// by @nx/enforce-module-boundaries (eslint.module-boundaries.mjs). See docs/DEPENDENCY_BOUNDARIES.md.
const path = require('node:path');

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Runtime dependencies must not form cycles, including through barrel exports.',
      severity: 'error',
      from: { path: '^(apps/rapaglaz-portfolio/src/app|libs)/' },
      to: { circular: true },
    },
    {
      name: 'content-is-independent',
      comment: 'Portfolio content is plain data; it imports nothing at runtime.',
      severity: 'error',
      from: { path: '^libs/portfolio/feature/src/lib/content/', pathNot: '\\.spec\\.ts$' },
      to: { pathNot: '^libs/portfolio/feature/src/lib/content/' },
    },
    {
      name: 'layout-peer-boundary',
      comment: 'The footer and the language switcher do not use the navbar or each other.',
      severity: 'error',
      from: {
        path: '^libs/portfolio/layout/src/lib/(footer|language-switcher)/',
        pathNot: '\\.spec\\.ts$',
      },
      to: {
        path: '^libs/portfolio/layout/src/lib/',
        pathNot: '^libs/portfolio/layout/src/lib/$1/',
      },
    },
    {
      name: 'no-cross-section',
      comment: 'Each portfolio section stays independent of its peers; the page composes them.',
      severity: 'error',
      from: { path: '^libs/portfolio/ui/src/lib/([^/]+)/', pathNot: '\\.spec\\.ts$' },
      to: {
        path: '^libs/portfolio/ui/src/lib/',
        pathNot: '^libs/portfolio/ui/src/lib/$1/',
      },
    },
    {
      name: 'portfolio-ui-in-feature-only',
      comment:
        'The section barrel re-exports every section; imported outside the lazy-loaded page, it pulls all sections into the initial bundle.',
      severity: 'error',
      from: {
        path: '^(apps/rapaglaz-portfolio/src/app|libs)/',
        pathNot: ['^libs/portfolio/(feature|ui)/', '\\.spec\\.ts$'],
      },
      to: { path: '^libs/portfolio/ui/' },
    },
    {
      name: 'no-production-to-testing',
      comment: 'Only spec files and other testing helpers may import the testing library.',
      severity: 'error',
      from: {
        path: '^(apps/rapaglaz-portfolio/src/app|libs)/',
        pathNot: ['\\.spec\\.ts$', '^libs/shared/testing/'],
      },
      to: { path: '^libs/shared/testing/' },
    },
    {
      name: 'no-production-to-specs',
      comment: 'Production files must not import spec files.',
      severity: 'error',
      from: {
        path: '^(apps/rapaglaz-portfolio/src/app|libs)/',
        pathNot: ['\\.spec\\.ts$', '^libs/shared/testing/'],
      },
      to: { path: '\\.spec\\.ts$' },
    },
    {
      name: 'no-orphans',
      comment:
        'Warn about isolated modules, excluding entry points, configs, routes, specs, and E2E.',
      severity: 'warn',
      from: {
        path: '^(apps/rapaglaz-portfolio/src/app|libs)/',
        orphan: true,
        pathNot: [
          // Library entry points are reached through path aliases; test-setup is loaded by Vitest
          '^libs/.+/src/(index|translations|bootstrap-messages|test-setup)\\.ts$',
          '(^|/)main(\\.server)?\\.ts$',
          '^apps/rapaglaz-portfolio/src/app/app\\.(config|routes)(\\.server)?\\.ts$',
          '\\.spec\\.ts$',
          '(^|/)e2e/',
        ],
      },
      to: {},
    },
  ],
  options: {
    includeOnly: '^(apps/rapaglaz-portfolio/src/app|libs/[^/]+/[^/]+/src)/',
    exclude: '(^|/)(node_modules|dist|coverage)/',
    // Absolute path: with a relative one, TypeScript resolves the tsconfig `extends` chain twice
    tsConfig: { fileName: path.join(__dirname, 'apps/rapaglaz-portfolio/tsconfig.app.json') },
    // Ignore type-only and other erased imports: they create no runtime dependency or cycle.
    // This applies to every rule, so type-only layer violations are intentionally not reported.
    // https://github.com/sverweij/dependency-cruiser/blob/v18.6.0/doc/options-reference.md#tsprecompilationdeps
    tsPreCompilationDeps: false,
  },
};
