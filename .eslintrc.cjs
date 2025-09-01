module.exports = {
  env: {
    browser: true,
    node: true,
    es2024: true
  },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2024, sourceType: 'module' },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    'no-useless-escape': 'off',
    'no-inner-declarations': 'off'
  },
  ignorePatterns: ['node_modules/', 'backups/']
};
