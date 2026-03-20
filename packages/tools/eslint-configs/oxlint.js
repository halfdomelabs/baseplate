// @ts-check
import oxlint from 'eslint-plugin-oxlint';

import { oxlintConfigBase } from '../oxlint.config.base.js';

const oxlintEslintConfigs = oxlint.buildFromOxlintConfig(oxlintConfigBase);

export default oxlintEslintConfigs;
