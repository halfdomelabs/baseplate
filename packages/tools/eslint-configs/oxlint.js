// @ts-check
import oxlint from 'eslint-plugin-oxlint';

import oxlintConfig from '../oxlint.config.ts';

const oxlintEslintConfigs = oxlint.buildFromOxlintConfig(oxlintConfig);

export default oxlintEslintConfigs;
