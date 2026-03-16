// @ts-check
import oxlint from 'eslint-plugin-oxlint';

import oxlintConfig from '../oxlint.config.base.ts';

// @ts-ignore -- oxlintConfig is not typed correctly
const oxlintEslintConfigs = oxlint.buildFromOxlintConfig(oxlintConfig);

export default oxlintEslintConfigs;
