module.exports = require('@halfdomelabs/tools/generators/eslintrc')({
  typescript: true,
  react: true,
  storybook: true,
  mdx: true,
  additionalTsConfigs: ['./tsconfig.eslint.json'],
});
