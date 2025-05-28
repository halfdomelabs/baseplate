import type { PluginConfigMigration } from '@halfdomelabs/project-builder-lib';

export const STORAGE_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'move-file-model',
    version: 1,
    migrate: (config) => {
      const typedConfig = config as {
        fileModelRef: string;
        featureRef: string;
      };
      return {
        ...typedConfig,
        storageFeatureRef: typedConfig.featureRef,
        fileModelRef: undefined,
        featureRef: undefined,
        modelRefs: {
          file: typedConfig.fileModelRef,
        },
      };
    },
  },
];
