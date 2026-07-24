import type {
  PluginConfigMigration,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

const EMAIL_FEATURE_NAME = 'emails';

export const EMAIL_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'add-email-feature-ref',
    version: 1,
    migrate: (config, projectDefinition) => {
      FeatureUtils.ensureFeatureByNameRecursively(
        projectDefinition as ProjectDefinition,
        EMAIL_FEATURE_NAME,
      );
      return {
        updatedConfig: {
          ...(config as Record<string, unknown>),
          emailFeatureRef: EMAIL_FEATURE_NAME,
        },
      };
    },
  },
];
