import { describe, expect, it } from 'vitest';

import { migration021MigrateBullmqToPlugin } from './migration-021-migrate-bullmq-to-plugin.js';

describe('migration021MigrateBullmqToPlugin', () => {
  it('adds queue and bullmq plugins when enableBullQueue is true', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Check enableBullQueue is removed
    expect(result.apps?.[0]).not.toHaveProperty('enableBullQueue');

    // Check queue plugin is added
    const queuePlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_queue',
    );
    expect(queuePlugin).toBeDefined();
    expect(queuePlugin?.config).toEqual({
      implementationPluginKey: 'baseplate-dev_plugin-queue_bullmq',
    });

    // Check bullmq plugin is added
    const bullmqPlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_bullmq',
    );
    expect(bullmqPlugin).toBeDefined();
    expect(bullmqPlugin?.config).toEqual({
      bullmqOptions: {
        deleteAfterDays: 7,
      },
    });
  });

  it('does not add plugins when enableBullQueue is false', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: false,
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Check enableBullQueue is removed
    expect(result.apps?.[0]).not.toHaveProperty('enableBullQueue');

    // Check no queue plugins are added
    const queuePlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_queue',
    );
    expect(queuePlugin).toBeUndefined();
  });

  it('does not add plugins when enableBullQueue is not present', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Check no plugins are added
    expect(result.plugins).toEqual([]);
  });

  it('handles multiple backend apps with mixed enableBullQueue values', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend 1',
          enableBullQueue: false,
        },
        {
          id: 'backend-2',
          type: 'backend',
          name: 'Backend 2',
          enableBullQueue: true,
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Check enableBullQueue is removed from all apps
    expect(result.apps?.[0]).not.toHaveProperty('enableBullQueue');
    expect(result.apps?.[1]).not.toHaveProperty('enableBullQueue');

    // Check plugins are added (because at least one has true)
    const queuePlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_queue',
    );
    expect(queuePlugin).toBeDefined();
  });

  it('updates existing queue plugin if present', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
      plugins: [
        {
          id: 'plugin:baseplate-dev_plugin-queue_queue',
          name: 'queue',
          packageName: '@baseplate-dev/plugin-queue',
          version: '0.5.0',
          config: {
            existingConfig: 'value',
          },
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    const queuePlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_queue',
    );
    expect(queuePlugin?.config).toEqual({
      existingConfig: 'value',
      implementationPluginKey: 'baseplate-dev_plugin-queue_bullmq',
    });
    // Should preserve version
    expect(queuePlugin?.version).toBe('0.5.0');
  });

  it('does not duplicate bullmq plugin if already present', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
      plugins: [
        {
          id: 'plugin:baseplate-dev_plugin-queue_bullmq',
          name: 'bullmq',
          packageName: '@baseplate-dev/plugin-queue',
          version: '0.5.0',
          config: {
            bullmqOptions: {
              deleteAfterDays: 14,
            },
          },
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Should only have 2 plugins (existing bullmq + new queue)
    expect(result.plugins?.length).toBe(2);

    // Existing bullmq config should be preserved
    const bullmqPlugin = result.plugins?.find(
      (p) => p.id === 'plugin:baseplate-dev_plugin-queue_bullmq',
    );
    expect(bullmqPlugin?.config).toEqual({
      bullmqOptions: {
        deleteAfterDays: 14,
      },
    });
  });

  it('preserves other backend app properties', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
          enableAxios: true,
          enableStripe: false,
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'backend-1',
      type: 'backend',
      name: 'Backend',
      enableAxios: true,
      enableStripe: false,
    });
  });

  it('preserves non-backend apps unchanged', () => {
    const oldConfig = {
      apps: [
        {
          id: 'web-1',
          type: 'web',
          name: 'Web App',
          customProp: 'value',
        },
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'web-1',
      type: 'web',
      name: 'Web App',
      customProp: 'value',
    });
  });

  it('handles missing apps array', () => {
    const oldConfig = {
      settings: {
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    expect(result.apps).toBeUndefined();
    expect(result.plugins).toEqual([]);
  });

  it('handles empty apps array', () => {
    const oldConfig = {
      apps: [],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    expect(result.apps).toEqual([]);
    expect(result.plugins).toEqual([]);
  });

  it('preserves existing plugins', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
      plugins: [
        {
          id: 'plugin:some-other-plugin',
          name: 'other',
          packageName: '@some/plugin',
          version: '1.0.0',
        },
      ],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    // Should have 3 plugins: existing + queue + bullmq
    expect(result.plugins?.length).toBe(3);

    const otherPlugin = result.plugins?.find(
      (p) => p.id === 'plugin:some-other-plugin',
    );
    expect(otherPlugin).toBeDefined();
  });

  it('preserves other root-level properties', () => {
    const oldConfig = {
      apps: [
        {
          id: 'backend-1',
          type: 'backend',
          name: 'Backend',
          enableBullQueue: true,
        },
      ],
      models: [{ id: 'model-1', name: 'User' }],
      features: [{ id: 'feature-1', name: 'Auth' }],
    };

    const result = migration021MigrateBullmqToPlugin.migrate(oldConfig);

    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
    expect((result as { features?: unknown }).features).toEqual([
      { id: 'feature-1', name: 'Auth' },
    ]);
  });
});
