import globals from 'globals';
import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import eslintConfigPrettier from 'eslint-config-prettier';

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

  // Global configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // for build scripts and tests
        'p5': 'readonly', // p5.js is a global in the examples
      },
    },
    rules: {
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    }
  },

  // Disable ESLint rules that conflict with Prettier
  eslintConfigPrettier,
];
