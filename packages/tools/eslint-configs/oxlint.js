// @ts-check
import oxlint from 'eslint-plugin-oxlint';
import path from 'node:path';

const oxlintEslintConfigs = oxlint.buildFromOxlintConfigFile(
  path.join(import.meta.dirname, '..', 'oxlintrc.json'),
);

export default oxlintEslintConfigs;
