import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import { buildDefaultNotificationCategory } from './plugin-definition.js';

export const NOTIFICATIONS_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'add-categories',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as { notificationsFeatureRef: string };
      return {
        updatedConfig: {
          ...typedConfig,
          categories: [buildDefaultNotificationCategory()],
        },
      };
    },
  },
];
