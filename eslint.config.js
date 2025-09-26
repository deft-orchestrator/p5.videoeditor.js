import globals from 'globals';
import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';
import p5jsConfig from 'eslint-config-p5js';

export default [
  // Ignore the build output directory
  {
    ignores: ['dist/'],
  },

  // Recommended ESLint settings
  js.configs.recommended,

  // Jest recommended settings, applied to test files
  {
    ...jestPlugin.configs['flat/recommended'],
    files: ['test/**/*.js'],
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
    },
  },

  // Configuration for p5.js examples
  {
    files: ['examples/**/*.js'],
    languageOptions: {
      globals: {
        ...p5jsConfig.globals,
        p5: 'readonly', // The p5 constructor is global in examples
      },
    },
  },

  // Global configuration for all other files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // for build scripts and tests
        p5: 'readonly', // The p5 constructor is global
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Disable ESLint rules that conflict with Prettier
  eslintConfigPrettier,
];
