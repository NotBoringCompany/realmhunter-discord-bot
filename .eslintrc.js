module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true,
  },
  'extends': 'google',
  'overrides': [
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
  },
  'rules': {
    'linebreak-style': [0, 'error', 'windows'],
    'indent': 'off',
    'object-curly-spacing': ['error', 'always'],
    'max-len': ['error', { 'code': 300 }],
    'spaced-comment': 'off',
    'arrow-parens': 'off',
    'no-multi-str': 'off',
    'new-cap': 'off',
    'valid-jsdoc': 'off',
  },
};
