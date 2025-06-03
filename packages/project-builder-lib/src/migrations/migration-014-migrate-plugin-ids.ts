import { createSchemaMigration } from './types.js';

interface OldConfig {
  plugins?: {
    id: string;
    name: string;
    packageName: string;
    version: string;
    config?: unknown;
  }[];
}

interface NewConfig {
  plugins?: {
    id: string;
    name: string;
    packageName: string;
    version: string;
    config?: unknown;
  }[];
}

const PLUGIN_MAPPINGS = {
  'plugin:halfdomelabs_baseplate-plugin-auth_auth0':
    'plugin:baseplate-dev_plugin-auth_auth0',
  'plugin:halfdomelabs_baseplate-plugin-storage_storage':
    'plugin:baseplate-dev_plugin-storage_storage',
} as const;

export const migration014MigratePluginIds = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 14,
  name: 'migratePluginIds',
  description:
    'Migrate plugin IDs and package names to new format and resets client version in preparation for 0.1.0 reset',
  migrate: (config) => {
    if (!config.plugins) {
      return config;
    }

    const plugins = config.plugins.map((plugin) => {
      const newId =
        plugin.id in PLUGIN_MAPPINGS
          ? PLUGIN_MAPPINGS[plugin.id as keyof typeof PLUGIN_MAPPINGS]
          : plugin.id;
      const newPackageName = plugin.packageName.replace(
        '@halfdomelabs/baseplate-',
        '@baseplate-dev/',
      );

      return {
        ...plugin,
        id: newId,
        packageName: newPackageName,
      };
    });

    return {
      ...config,
      plugins,
      cliVersion: '0.1.0',
    };
  },
});
