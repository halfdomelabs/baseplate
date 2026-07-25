import { createSchemaMigration } from './types.js';

interface AppConfig {
  type?: string;
  includeAuth?: boolean;
  includeUploadComponents?: boolean;
  includeNotifications?: boolean;
  pluginData?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

interface OldConfig {
  apps?: AppConfig[];
  [key: string]: unknown;
}

interface NewConfig {
  apps?: AppConfig[];
  [key: string]: unknown;
}

// Plugin keys (prefix-stripped, matching `pluginEntityType.keyFromId`) that own
// the relocated per-app flags.
const STORAGE_PLUGIN_KEY = 'baseplate-dev_plugin-storage_storage';
const NOTIFICATIONS_PLUGIN_KEY =
  'baseplate-dev_plugin-notifications_notifications';

/**
 * Moves hardcoded per-app opt-in flags off the core web app config and into the
 * generic `pluginData[pluginKey]` bag introduced by the web app schema extension
 * point.
 *
 * - `includeUploadComponents` -> `pluginData['<storage>'].includeUploadComponents`
 * - `includeNotifications`    -> `pluginData['<notifications>'].includeNotifications`
 * - `includeAuth`             -> dropped (it was never read by any generator)
 *
 * Only `true` values are relocated so existing opt-ins are preserved; the flags
 * are always stripped from the core config.
 */
export const migration032WebAppPluginData = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 32,
  name: 'webAppPluginData',
  description:
    'Move includeUploadComponents/includeNotifications into web app pluginData and drop includeAuth',
  migrate: (config) => {
    const apps = config.apps?.map((app) => {
      if (app.type !== 'web') return app;

      const {
        includeAuth: _includeAuth,
        includeUploadComponents,
        includeNotifications,
        pluginData: existingPluginData,
        ...rest
      } = app;

      const pluginData: Record<string, Record<string, unknown>> = {
        ...existingPluginData,
      };

      if (includeUploadComponents) {
        pluginData[STORAGE_PLUGIN_KEY] = {
          ...pluginData[STORAGE_PLUGIN_KEY],
          includeUploadComponents: true,
        };
      }
      if (includeNotifications) {
        pluginData[NOTIFICATIONS_PLUGIN_KEY] = {
          ...pluginData[NOTIFICATIONS_PLUGIN_KEY],
          includeNotifications: true,
        };
      }

      return Object.keys(pluginData).length > 0
        ? { ...rest, pluginData }
        : rest;
    });

    return { ...config, apps: apps ?? [] };
  },
});
