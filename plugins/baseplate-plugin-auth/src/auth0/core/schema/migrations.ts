import type { PluginConfigMigration } from '@halfdomelabs/project-builder-lib';

export const AUTH0_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'move-models',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as { userAccountModelRef: string };
      return {
        ...typedConfig,
        userAccountModelRef: undefined,
        modelRefs: {
          user: typedConfig.userAccountModelRef,
        },
      };
    },
  },
];
