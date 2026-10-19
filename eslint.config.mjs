import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import eslint from '@eslint/js';
import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { moduleBoundaries } from './eslint.module-boundaries.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  moduleBoundaries(),
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vitest.config.*.timestamp*',
      '**/coverage',
      'scripts/**',
    ],
  },
  {
    files: ['**/*.{ts,mts}'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          // The root vitest.config.mts belongs to no project tsconfig
          allowDefaultProject: ['*.mts'],
          defaultProject: 'tsconfig.base.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/array-type': ['warn'],
      '@typescript-eslint/consistent-type-assertions': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          // Enforce NO "Component" suffix for Angular components
          selector: 'class',
          modifiers: ['exported'],
          format: ['PascalCase'],
          custom: {
            regex: 'Component$',
            match: false,
          },
        },
      ],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/unified-signatures': 'warn',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true, // Allow empty classes with decorators (Angular components)
        },
      ],

      'max-lines': ['warn', 500],
    },
  },
  // Test files configuration with relaxed rules
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
    },
  },

  // Configuration files with specific rules
  {
    files: ['*.config.{js,ts,mts}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
);
