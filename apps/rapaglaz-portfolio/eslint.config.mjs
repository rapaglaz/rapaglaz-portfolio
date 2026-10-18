import nx from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import baseConfig from '../../eslint.config.mjs';

export default defineConfig(
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      '@angular-eslint/prefer-output-readonly': 'warn',
      '@angular-eslint/prefer-signals': 'warn',
      '@angular-eslint/prefer-standalone': 'warn',
      '@angular-eslint/use-lifecycle-interface': 'error',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // Accessibility
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/elements-content': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/table-scope': 'warn',
      '@angular-eslint/template/valid-aria': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/mouse-events-have-key-events': 'warn',

      // Other template rules
      '@angular-eslint/template/no-duplicate-attributes': 'warn',
      '@angular-eslint/template/conditional-complexity': ['warn', { maxComplexity: 5 }],
      '@angular-eslint/template/cyclomatic-complexity': ['warn', { maxComplexity: 5 }],
      '@angular-eslint/template/use-track-by-function': 'warn',
      '@angular-eslint/template/button-has-type': 'warn',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'warn',
      '@angular-eslint/template/prefer-self-closing-tags': 'warn',
    },
  },
);
