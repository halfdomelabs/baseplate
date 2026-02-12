import { createSchemaMigration } from './types.js';

interface OldBackendApp {
  id: string;
  type: string;
  name: string;
  enableBullQueue?: boolean;
  [key: string]: unknown;
}

interface NewBackendApp {
  id: string;
  type: string;
  name: string;
  [key: string]: unknown;
}

interface PluginConfig {
  id: string;
  name: string;
  packageName: string;
  version: string;
  config?: unknown;
}

interface OldConfig {
  apps?: OldBackendApp[];
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

interface NewConfig {
  apps?: NewBackendApp[];
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

/**
 * Migration to move enableBullQueue from backend apps to queue/bullmq plugins
 *
 * This migration:
 * 1. Finds backend apps with enableBullQueue: true
 * 2. If found, adds the queue parent plugin with implementationPluginKey pointing to bullmq
 * 3. Adds the bullmq child plugin with default config
 * 4. Removes enableBullQueue from all backend apps
 */
export const migration021MigrateBullmqToPlugin = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 21,
  name: 'migrateBullmqToPlugin',
  description:
    'Migrate enableBullQueue from backend apps to queue/bullmq plugins',
  migrate: (config) => {
    // Find if any backend app has enableBullQueue: true
    const hasBullQueue = config.apps?.some(
      (app) => app.type === 'backend' && app.enableBullQueue === true,
    );

    // Remove enableBullQueue from all apps
    const apps = config.apps?.map((app) => {
      if (app.type === 'backend' && 'enableBullQueue' in app) {
        const { enableBullQueue: _enableBullQueue, ...rest } = app;
        return rest as NewBackendApp;
      }
      return app as NewBackendApp;
    });

    // If enableBullQueue was set, add the plugins
    const plugins = config.plugins ? [...config.plugins] : [];

    if (hasBullQueue) {
      const queuePluginId = 'plugin:baseplate-dev_plugin-queue_queue';
      const bullmqPluginId = 'plugin:baseplate-dev_plugin-queue_bullmq';

      // Add/update queue parent plugin
      const queuePluginIndex = plugins.findIndex((p) => p.id === queuePluginId);

      if (queuePluginIndex === -1) {
        plugins.push({
          id: queuePluginId,
          name: 'queue',
          packageName: '@baseplate-dev/plugin-queue',
          version: '1.0.0',
          config: {
            implementationPluginKey: 'baseplate-dev_plugin-queue_bullmq',
          },
        });
      } else {
        plugins[queuePluginIndex] = {
          ...plugins[queuePluginIndex],
          config: {
            ...(plugins[queuePluginIndex].config as object),
            implementationPluginKey: 'baseplate-dev_plugin-queue_bullmq',
          },
        };
      }

      // Add bullmq child plugin if not exists
      const bullmqPluginIndex = plugins.findIndex(
        (p) => p.id === bullmqPluginId,
      );

      if (bullmqPluginIndex === -1) {
        plugins.push({
          id: bullmqPluginId,
          name: 'bullmq',
          packageName: '@baseplate-dev/plugin-queue',
          version: '1.0.0',
          config: {
            bullmqOptions: {
              deleteAfterDays: 7,
            },
          },
        });
      }
    }

    return {
      ...config,
      apps,
      plugins,
    } as NewConfig;
  },
});
