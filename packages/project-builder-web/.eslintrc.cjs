module.exports = require('@halfdomelabs/tools/generators/eslintrc')({
  typescript: true,
  react: true,
  additionalTsConfigs: ['./tsconfig.node.json'],
  tsconfigRootDir: __dirname,
});
