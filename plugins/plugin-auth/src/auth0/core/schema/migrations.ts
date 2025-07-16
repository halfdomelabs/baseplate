import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

export const AUTH0_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'move-models',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as { userAccountModelRef: string };
      return {
        updatedConfig: {
          ...typedConfig,
          userAccountModelRef: undefined,
          modelRefs: {
            user: typedConfig.userAccountModelRef,
          },
        },
      };
    },
  },
];
