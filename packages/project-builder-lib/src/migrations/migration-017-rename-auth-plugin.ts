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

export const migration017RenameAuthPlugin = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 17,
  name: 'renameAuthPlugin',
  description:
    'Rename plugin plugin-auth_auth to plugin-auth_local-auth for the new auth plugin architecture',
  migrate: (config) => {
    if (!config.plugins) {
      return config;
    }

    const plugins = config.plugins.map((plugin) => {
      // Rename plugin-auth_auth to plugin-auth_local-auth
      if (plugin.id === 'plugin:baseplate-dev_plugin-auth_auth') {
        return {
          ...plugin,
          name: 'local-auth',
          id: 'plugin:baseplate-dev_plugin-auth_local-auth',
        };
      }

      return plugin;
    });

    return {
      ...config,
      plugins,
    };
  },
});
