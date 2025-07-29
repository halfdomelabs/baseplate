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
    'Rename plugin plugin-auth_auth to plugin-auth_local-auth and auto-activate auth manager plugin',
  migrate: (config) => {
    if (!config.plugins) {
      return config;
    }

    let plugins = [...config.plugins];
    let renamedPlugin: (typeof plugins)[0] | null = null;

    // Step 1: Rename plugin-auth_auth to plugin-auth_local-auth
    plugins = plugins.map((plugin) => {
      if (plugin.id === 'plugin:baseplate-dev_plugin-auth_auth') {
        renamedPlugin = {
          ...plugin,
          name: 'local-auth',
          id: 'plugin:baseplate-dev_plugin-auth_local-auth',
        };
        return renamedPlugin;
      }
      return plugin;
    });

    // Step 2: Check for any auth implementation plugins
    const authImplementationPlugins = plugins.filter(
      (plugin) =>
        plugin.id === 'plugin:baseplate-dev_plugin-auth_local-auth' ||
        plugin.id === 'plugin:baseplate-dev_plugin-auth_auth0' ||
        plugin.id === 'plugin:baseplate-dev_plugin-auth_placeholder-auth',
    );

    // Step 3: If any implementation plugins exist, create main auth plugin with ported config
    if (authImplementationPlugins.length > 0) {
      // Determine the primary implementation plugin (prioritize local-auth > auth0 > placeholder)
      const primaryImplementationPlugin =
        authImplementationPlugins.find(
          (p) => p.id === 'plugin:baseplate-dev_plugin-auth_local-auth',
        ) ??
        authImplementationPlugins.find(
          (p) => p.id === 'plugin:baseplate-dev_plugin-auth_auth0',
        ) ??
        authImplementationPlugins.find(
          (p) => p.id === 'plugin:baseplate-dev_plugin-auth_placeholder-auth',
        );

      if (primaryImplementationPlugin) {
        // Extract implementation key from plugin ID
        const implementationPluginKey = primaryImplementationPlugin.id.replace(
          'plugin:',
          '',
        );

        // Port configuration from the implementation plugin
        const implementationConfig = (primaryImplementationPlugin.config ??
          {}) as Record<string, unknown>;

        // Create main auth plugin with ported configuration
        plugins.push({
          id: 'plugin:baseplate-dev_plugin-auth_auth',
          name: 'auth',
          packageName: '@baseplate-dev/plugin-auth',
          version: '1.0.0',
          config: {
            implementationPluginKey,
            authFeatureRef: implementationConfig.authFeatureRef,
            roles: implementationConfig.roles,
          },
        });
      }
    }

    return {
      ...config,
      plugins,
    };
  },
});
