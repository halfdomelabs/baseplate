import oxlintConfigBase, {
  oxlintIgnorePatterns,
} from '@baseplate-dev/tools/oxlint-config-base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [oxlintConfigBase],
  ignorePatterns: [...oxlintIgnorePatterns, 'src/morphers/tests/**'],
});
