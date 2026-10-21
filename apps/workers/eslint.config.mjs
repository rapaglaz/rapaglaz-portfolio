import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { moduleBoundaries } from '../../eslint.module-boundaries.mjs';

// Own config for the Cloudflare Workers: ESLint uses the config nearest to each file, so the root
// config (Angular, TypeScript) does not apply here, and a change to it does not affect the Workers.
// The TypeScript presets are the same as in the root config. The Nx project boundary rule is
// shared with the root config. The specs share a helper in testing/, which belongs to no project.
export default defineConfig(
  // wrangler dev (pnpm start) writes its bundles to .wrangler/; ESLint does not read .gitignore
  globalIgnores(['**/.wrangler/']),
  moduleBoundaries(['../testing/wrangler-config']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      eslintConfigPrettier,
    ],
    // the same two rules as in the root config
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
    },
  },
  {
    // the Vitest config of each Worker, and the Workers that are still JavaScript
    files: ['**/*.{js,mjs}'],
    extends: [eslint.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Workers runtime (Fetch API) globals the JavaScript sources use
      globals: {
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        TextEncoder: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
);
