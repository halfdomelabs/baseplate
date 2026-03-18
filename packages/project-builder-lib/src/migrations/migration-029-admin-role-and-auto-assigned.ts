import { createSchemaMigration } from './types.js';

interface RoleConfig {
  id: string;
  name: string;
  builtIn: boolean;
  autoAssigned?: boolean;
  [key: string]: unknown;
}

interface PluginConfig {
  id: string;
  name: string;
  config?: {
    initialUserRoles?: unknown;
    userAdminRoles?: unknown;
    additionalUserAdminRoles?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AuthPluginConfig {
  roles?: RoleConfig[];
  [key: string]: unknown;
}

interface OldConfig {
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

const AUTH_PLUGIN_NAME = 'auth';
const LOCAL_AUTH_PLUGIN_ID = 'plugin:baseplate-dev_plugin-auth_local-auth';
const BETTER_AUTH_PLUGIN_ID = 'plugin:baseplate-dev_plugin-auth_better-auth';

/**
 * Migration to:
 * 1. Add `autoAssigned` flag to existing roles (true for public/user/system, false for others)
 * 2. Add built-in `admin` role if not already present
 * 3. Rename `userAdminRoles` → `additionalUserAdminRoles` in local-auth and better-auth plugin configs
 * 4. Remove `initialUserRoles` from plugin configs
 */
export const migration029AdminRoleAndAutoAssigned = createSchemaMigration<
  OldConfig,
  OldConfig
>({
  version: 29,
  name: 'adminRoleAndAutoAssigned',
  description:
    'Add built-in admin role, autoAssigned flag, rename userAdminRoles to additionalUserAdminRoles',
  migrate: (config) => {
    const plugins = config.plugins ? [...config.plugins] : [];

    // Find the auth plugin and update roles
    const authPlugin = plugins.find((p) => p.name === AUTH_PLUGIN_NAME);
    if (authPlugin?.config) {
      const authConfig = authPlugin.config as AuthPluginConfig;
      if (authConfig.roles) {
        const autoAssignedRoles = new Set(['public', 'user', 'system']);

        // Add autoAssigned flag to existing roles
        authConfig.roles = authConfig.roles.map((role) => ({
          ...role,
          autoAssigned: autoAssignedRoles.has(role.name),
        }));

        // Add admin role if not already present
        if (!authConfig.roles.some((r) => r.name === 'admin')) {
          authConfig.roles.push({
            id: `auth-role:${crypto.randomUUID()}`,
            name: 'admin',
            comment: 'Administrator with full access',
            builtIn: true,
            autoAssigned: false,
          });
        } else {
          // If admin exists but isn't builtIn, make it builtIn
          authConfig.roles = authConfig.roles.map((role) =>
            role.name === 'admin'
              ? { ...role, builtIn: true, autoAssigned: false }
              : role,
          );
        }
      }
    }

    // Update local-auth and better-auth plugin configs
    for (const plugin of plugins) {
      if (
        plugin.id !== LOCAL_AUTH_PLUGIN_ID &&
        plugin.id !== BETTER_AUTH_PLUGIN_ID
      ) {
        continue;
      }

      if (!plugin.config) {
        continue;
      }

      // Rename userAdminRoles → additionalUserAdminRoles
      if ('userAdminRoles' in plugin.config) {
        plugin.config.additionalUserAdminRoles = plugin.config.userAdminRoles;
        delete plugin.config.userAdminRoles;
      }

      // Remove initialUserRoles
      if ('initialUserRoles' in plugin.config) {
        delete plugin.config.initialUserRoles;
      }
    }

    return {
      ...config,
      plugins,
    };
  },
});
