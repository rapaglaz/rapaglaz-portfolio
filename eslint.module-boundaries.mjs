import nx from '@nx/eslint-plugin';

// Boundaries between Nx projects, shared by the root and the Workers ESLint configs.
// Layers inside the app are checked by dependency-cruiser (.dependency-cruiser.cjs).
// Every project has a type tag; libraries also have a scope tag. Nx forbids importing an app
// from another project. A new library gets both tags, and the constraints below list the tags
// each project may use.
// Files outside every project count as external resources; `allow` lists the exact imports of
// such files a config accepts.
export const moduleBoundaries = (allow = []) => ({
  files: ['**/*.{ts,mts,js,mjs}'],
  // ESLint configs extend the root config, which belongs to no project
  ignores: ['**/eslint.config.mjs'],
  plugins: { '@nx': nx },
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        allow,
        depConstraints: [
          {
            sourceTag: 'type:app',
            onlyDependOnLibsWithTags: [
              'type:feature',
              'type:data-access',
              'type:ui',
              'type:util',
              'type:testing',
            ],
          },
          {
            sourceTag: 'type:feature',
            onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:util', 'type:testing'],
          },
          // The E2E project tests the app through its implicit dependency, not through imports
          { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:app'] },
          { sourceTag: 'type:worker', onlyDependOnLibsWithTags: [] },
          // Data access owns its overlay UI (the Turnstile modal), so it needs no UI library
          {
            sourceTag: 'type:data-access',
            onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'type:testing'],
          },
          {
            sourceTag: 'type:ui',
            onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:testing'],
          },
          // Utilities stay leaves; the testing helpers build on them. dependency-cruiser keeps
          // production files from importing the testing library, which this rule cannot see.
          { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
          { sourceTag: 'type:testing', onlyDependOnLibsWithTags: ['type:util'] },
          { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
          {
            sourceTag: 'scope:portfolio',
            onlyDependOnLibsWithTags: ['scope:portfolio', 'scope:shared'],
          },
        ],
      },
    ],
  },
});
