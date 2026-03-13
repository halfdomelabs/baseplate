import { describe, expect, it } from 'vitest';

import { migration027EnableSentryPlugin } from './migration-027-enable-sentry-plugin.js';

const SENTRY_PLUGIN_ID = 'plugin:baseplate-dev_plugin-observability_sentry';

describe('migration027EnableSentryPlugin', () => {
  it('adds sentry plugin to projects with no plugins', () => {
    const oldConfig = {};

    const result = migration027EnableSentryPlugin.migrate(oldConfig);

    const sentryPlugin = result.plugins?.find((p) => p.id === SENTRY_PLUGIN_ID);
    expect(sentryPlugin).toBeDefined();
    expect(sentryPlugin?.name).toBe('sentry');
    expect(sentryPlugin?.packageName).toBe(
      '@baseplate-dev/plugin-observability',
    );
    expect(sentryPlugin?.config).toEqual({ sentryOptions: {} });
  });

  it('adds sentry plugin to projects with existing plugins', () => {
    const oldConfig = {
      plugins: [
        {
          id: 'plugin:some-other-plugin',
          name: 'other',
          packageName: '@some/plugin',
          version: '1.0.0',
        },
      ],
    };

    const result = migration027EnableSentryPlugin.migrate(oldConfig);

    expect(result.plugins?.length).toBe(2);

    const otherPlugin = result.plugins?.find(
      (p) => p.id === 'plugin:some-other-plugin',
    );
    expect(otherPlugin).toBeDefined();

    const sentryPlugin = result.plugins?.find((p) => p.id === SENTRY_PLUGIN_ID);
    expect(sentryPlugin).toBeDefined();
  });

  it('does not duplicate sentry plugin if already present', () => {
    const oldConfig = {
      plugins: [
        {
          id: SENTRY_PLUGIN_ID,
          name: 'sentry',
          packageName: '@baseplate-dev/plugin-observability',
          version: '0.2.0',
          config: { sentryOptions: {} },
        },
      ],
    };

    const result = migration027EnableSentryPlugin.migrate(oldConfig);

    expect(result.plugins?.length).toBe(1);
    expect(result.plugins?.[0]?.version).toBe('0.2.0');
  });

  it('preserves other root-level properties', () => {
    const oldConfig = {
      models: [{ id: 'model-1', name: 'User' }],
      features: [{ id: 'feature-1', name: 'Auth' }],
    };

    const result = migration027EnableSentryPlugin.migrate(oldConfig);

    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
    expect((result as { features?: unknown }).features).toEqual([
      { id: 'feature-1', name: 'Auth' },
    ]);

    const sentryPlugin = result.plugins?.find((p) => p.id === SENTRY_PLUGIN_ID);
    expect(sentryPlugin).toBeDefined();
  });
});
