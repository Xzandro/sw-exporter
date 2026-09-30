const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  { ignores: ['dist/', 'app/bundle.js'] },
  {
    languageOptions: {
      ecmaVersion: 13,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  prettierRecommended,
];
