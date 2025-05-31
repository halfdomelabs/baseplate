import { createSchemaMigration } from './types.js';

interface OldConfig {
  auth?: {
    userModelRef: string;
    userRoleModelRef: string;
    useAuth0: boolean;
    authFeatureRef: string;
    accountsFeatureRef: string;
    passwordProvider?: boolean;
    roles: {
      id: string;
      name: string;
      comment: string;
      builtIn: boolean;
    }[];
  };
  plugins?: {
    id: string;
    name: string;
    packageName: string;
    version: string;
    config?: unknown;
  }[];
}

interface NewConfig {
  auth?: undefined;
  plugins?: {
    id: string;
    name: string;
    packageName: string;
    version: string;
    config?: unknown;
  }[];
}

export const migration012MigrateAuthConfig = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 12,
  name: 'migrateAuthConfig',
  description: 'Migrate auth config to auth0 plugin config',
  migrate: (config) => {
    if (!config.auth?.useAuth0) {
      return {
        ...config,
        auth: undefined,
      };
    }

    const auth0PluginId = 'plugin:halfdomelabs_baseplate-plugin-auth_auth0';

    const auth0Config = {
      userAccountModelRef: config.auth.userModelRef,
      authFeatureRef: config.auth.authFeatureRef,
      roles: config.auth.roles.map((role) => ({
        id: role.id,
        name: role.name,
        comment: role.comment,
        builtIn: role.builtIn,
      })),
    };

    const plugins = config.plugins ?? [];
    const pluginIndex = plugins.findIndex((p) => p.id === auth0PluginId);

    if (pluginIndex === -1) {
      plugins.push({
        id: auth0PluginId,
        name: 'auth0',
        packageName: '@halfdomelabs/baseplate-plugin-auth',
        version: '0.1.0',
        config: auth0Config,
      });
    } else {
      plugins[pluginIndex] = {
        ...plugins[pluginIndex],
        config: auth0Config,
      };
    }

    return {
      ...config,
      auth: undefined,
      plugins,
    };
  },
});
