const baseConfigs = ['airbnb-base'];

const typescriptConfigs = [
  'airbnb-typescript/base',
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:@typescript-eslint/recommended-requiring-type-checking',
];

const typescriptParserOptions = {
  project: './tsconfig.json',
};

const typescriptRules = {
  '@typescript-eslint/explicit-function-return-type': [
    'error',
    { allowExpressions: true, allowTypedFunctionExpressions: true },
  ],
};

const typescriptSettings = {
  'import/resolver': {
    typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
  },
};

module.exports = function createEslintConfig(options) {
  const typescript = options.typescript || false;
  return {
    root: true,
    parserOptions: typescript ? typescriptParserOptions : {},
    ignorePatterns: ['.eslintrc.js'],
    extends: [
      ...(typescript ? typescriptConfigs : baseConfigs),
      'plugin:jest/recommended',
      'plugin:jest/style',
      'prettier',
      ...(typescript ? ['prettier/@typescript-eslint'] : []),
    ],
    rules: {
      ...(typescript ? typescriptRules : {}),
      'import/prefer-default-export': 'off',
      'class-methods-use-this': 'off',
      'no-console': 'off',
      'no-template-curly-in-string': 'off',
    },
    env: {
      node: true,
      browser: false,
      jest: true,
    },
    settings: typescript ? typescriptSettings : {},
  };
};
