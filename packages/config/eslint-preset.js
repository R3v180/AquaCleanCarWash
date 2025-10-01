// File: /packages/config/eslint-preset.js - v1.0

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Reglas de TypeScript
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',

    // Reglas de React
    'react/prop-types': 'off', // No necesitamos prop-types porque usamos TypeScript
    'react/react-in-jsx-scope': 'off', // No es necesario importar React en el scope con React 17+
    'react/jsx-uses-react': 'off',

    // Reglas generales de ESLint
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.turbo/',
    'coverage/',
  ],
};