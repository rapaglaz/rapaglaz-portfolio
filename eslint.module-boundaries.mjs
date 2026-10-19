import nx from '@nx/eslint-plugin';

// Boundaries between Nx projects, shared by the root and the Workers ESLint configs.
// Layers inside the app are checked by dependency-cruiser (.dependency-cruiser.cjs).
// The workspace has only applications, and Nx forbids importing an app from another project.
// A new library gets a tag, and the constraints below list the tags each project may use.
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
          { sourceTag: 'type:app', onlyDependOnLibsWithTags: [] },
          // The E2E project tests the app through its implicit dependency, not through imports
          { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:app'] },
          { sourceTag: 'type:worker', onlyDependOnLibsWithTags: [] },
        ],
      },
    ],
  },
});
