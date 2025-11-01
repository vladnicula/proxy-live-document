import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '.husky/',
      '*.config.js',
      '*.config.ts',
      'package-lock.json',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'no-trailing-spaces': 'warn',
      'semi': ['warn', 'never'],
      'quotes': ['warn', 'single', { 'avoidEscape': true }],
      'comma-dangle': ['warn', 'always-multiline'],
      'comma-spacing': ['warn', { 'before': false, 'after': true }],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'space-before-function-paren': ['warn', { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' }],
      'space-in-parens': ['warn', 'never'],
      'keyword-spacing': ['warn', { 'before': true, 'after': true }],
      'arrow-spacing': ['warn', { 'before': true, 'after': true }],
      'no-multiple-empty-lines': ['warn', { 'max': 1, 'maxEOF': 0 }],
      'eol-last': ['warn', 'always'],
      'max-len': ['warn', { 'code': 120, 'ignoreUrls': true, 'ignoreStrings': true, 'ignoreTemplateLiterals': true }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-prototype-builtins': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      'no-undef': 'warn',
    },
  },
]
// test change
