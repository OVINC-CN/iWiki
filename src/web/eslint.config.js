import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default defineConfig([
  globalIgnores(['dist', 'public', 'node_modules', 'src/components/ui']),
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  ...compat.extends('alloy'),
  ...compat.extends('alloy/react'),
  ...compat.extends('alloy/typescript'),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // React Hooks
      'react-hooks/set-state-in-effect': 'off',

      // Code complexity
      'complexity': ['error', { max: 25 }],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],

      // Code style
      'semi': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'object-curly-spacing': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],
      'space-infix-ops': 'error',
      'indent': ['error', 4],
      'no-multi-spaces': 'error',
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'jsx-quotes': ['error', 'prefer-double'],
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-trailing-spaces': 'error',

      // Best practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // React
      'react/self-closing-comp': ['error', {
        component: true,
        html: true,
      }],
      'react/jsx-curly-brace-presence': ['error', {
        props: 'never',
        children: 'never',
      }],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
      'react/no-array-index-key': 'warn',
    },
  },
])
