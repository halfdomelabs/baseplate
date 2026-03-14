import { describe, expect, it } from 'vitest';

import { migration028EnableStripePlugin } from './migration-028-enable-stripe-plugin.js';

const STRIPE_PLUGIN_ID = 'plugin:baseplate-dev_plugin-payments_stripe';

describe('migration028EnableStripePlugin', () => {
  it('adds stripe plugin when an app has enableStripe: true', () => {
    const oldConfig = {
      apps: [{ type: 'backend', enableStripe: true }],
    };

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    const stripePlugin = result.plugins?.find((p) => p.id === STRIPE_PLUGIN_ID);
    expect(stripePlugin).toBeDefined();
    expect(stripePlugin?.name).toBe('stripe');
    expect(stripePlugin?.packageName).toBe('@baseplate-dev/plugin-payments');
    expect(stripePlugin?.config).toEqual({ stripeOptions: {} });
  });

  it('removes enableStripe from all app configs', () => {
    const oldConfig = {
      apps: [
        { type: 'backend', enableStripe: true, devPort: 5001 },
        { type: 'backend', enableStripe: false, devPort: 5002 },
      ],
    };

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    for (const app of result.apps ?? []) {
      expect(app).not.toHaveProperty('enableStripe');
    }
    expect(result.apps?.[0]).toHaveProperty('devPort', 5001);
    expect(result.apps?.[1]).toHaveProperty('devPort', 5002);
  });

  it('does not add stripe plugin when no app has enableStripe: true', () => {
    const oldConfig = {
      apps: [{ type: 'backend', enableStripe: false }],
    };

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    expect(result.plugins?.length ?? 0).toBe(0);
  });

  it('does not duplicate stripe plugin if already present', () => {
    const oldConfig = {
      apps: [{ type: 'backend', enableStripe: true }],
      plugins: [
        {
          id: STRIPE_PLUGIN_ID,
          name: 'stripe',
          packageName: '@baseplate-dev/plugin-payments',
          version: '0.2.0',
          config: { stripeOptions: {} },
        },
      ],
    };

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    const stripePlugins = result.plugins?.filter(
      (p) => p.id === STRIPE_PLUGIN_ID,
    );
    expect(stripePlugins?.length).toBe(1);
    expect(stripePlugins?.[0]?.version).toBe('0.2.0');
  });

  it('preserves existing plugins and other root-level properties', () => {
    const oldConfig = {
      apps: [{ type: 'backend', enableStripe: true }],
      plugins: [
        {
          id: 'plugin:some-other-plugin',
          name: 'other',
          packageName: '@some/plugin',
          version: '1.0.0',
        },
      ],
      models: [{ id: 'model-1', name: 'User' }],
    };

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    expect(result.plugins?.length).toBe(2);
    expect(
      result.plugins?.find((p) => p.id === 'plugin:some-other-plugin'),
    ).toBeDefined();
    expect(
      result.plugins?.find((p) => p.id === STRIPE_PLUGIN_ID),
    ).toBeDefined();
    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
  });

  it('handles config with no apps', () => {
    const oldConfig = {};

    const result = migration028EnableStripePlugin.migrate(oldConfig);

    expect(result.plugins?.length ?? 0).toBe(0);
    expect(result.apps).toEqual([]);
  });
});
