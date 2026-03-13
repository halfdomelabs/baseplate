import { createSchemaMigration } from './types.js';

interface PluginConfig {
  id: string;
  name: string;
  packageName: string;
  version: string;
  config?: unknown;
}

interface OldConfig {
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

interface NewConfig {
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

const SENTRY_PLUGIN_ID = 'plugin:baseplate-dev_plugin-observability_sentry';

/**
 * Migration to auto-enable the Sentry plugin on all existing projects.
 *
 * Sentry was previously always-on (hardcoded in compilers). Now that it's been
 * extracted into plugin-observability, existing projects need the plugin entry
 * added so they don't lose Sentry when upgrading.
 */
export const migration027EnableSentryPlugin = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 27,
  name: 'enableSentryPlugin',
  description:
    'Auto-enable Sentry plugin for existing projects (previously always-on)',
  migrate: (config) => {
    const plugins = config.plugins ? [...config.plugins] : [];

    // Skip if sentry plugin already exists
    const existingIndex = plugins.findIndex((p) => p.id === SENTRY_PLUGIN_ID);

    if (existingIndex === -1) {
      plugins.push({
        id: SENTRY_PLUGIN_ID,
        name: 'sentry',
        packageName: '@baseplate-dev/plugin-observability',
        version: '0.1.0',
        config: {
          sentryOptions: {},
        },
      });
    }

    return {
      ...config,
      plugins,
    };
  },
});
