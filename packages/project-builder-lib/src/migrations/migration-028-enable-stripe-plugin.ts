import { createSchemaMigration } from './types.js';

interface AppConfig {
  enableStripe?: boolean;
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
  apps?: AppConfig[];
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

interface NewConfig {
  apps?: AppConfig[];
  plugins?: PluginConfig[];
  [key: string]: unknown;
}

const STRIPE_PLUGIN_ID = 'plugin:baseplate-dev_plugin-payments_stripe';

/**
 * Migration to convert enableStripe boolean on backend apps into a
 * plugin-payments:stripe plugin entry, and remove enableStripe from app configs.
 *
 * Stripe was previously toggled via a boolean on the backend app config.
 * Now that it's been extracted into plugin-payments, existing projects need
 * the plugin entry added so they don't lose Stripe when upgrading.
 */
export const migration028EnableStripePlugin = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 28,
  name: 'enableStripePlugin',
  description:
    'Convert enableStripe boolean to plugin-payments:stripe plugin entry',
  migrate: (config) => {
    const apps = config.apps ? [...config.apps] : [];
    const plugins = config.plugins ? [...config.plugins] : [];

    // Check if any app has enableStripe
    const hasStripeEnabled = apps.some((app) => app.enableStripe);

    // Add stripe plugin if any app had it enabled and it doesn't already exist
    if (hasStripeEnabled) {
      const existingIndex = plugins.findIndex((p) => p.id === STRIPE_PLUGIN_ID);

      if (existingIndex === -1) {
        plugins.push({
          id: STRIPE_PLUGIN_ID,
          name: 'stripe',
          packageName: '@baseplate-dev/plugin-payments',
          version: '0.1.0',
          config: {
            stripeOptions: {},
          },
        });
      }
    }

    // Remove enableStripe from all app configs
    const updatedApps = apps.map((app) => {
      const { enableStripe: _, ...rest } = app;
      return rest;
    });

    return {
      ...config,
      apps: updatedApps,
      plugins,
    };
  },
});
