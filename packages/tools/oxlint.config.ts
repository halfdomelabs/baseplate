import { defineConfig } from 'oxlint';

import {
  oxlintConfigBase,
  oxlintIgnorePatterns,
} from './oxlint.config.base.js';

export default defineConfig({
  extends: [oxlintConfigBase],
  ignorePatterns: oxlintIgnorePatterns,
});
