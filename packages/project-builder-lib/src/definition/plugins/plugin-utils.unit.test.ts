import { describe, expect, test } from 'vitest';

import { createTestProjectDefinition } from '#src/definition/project-definition-container.test-utils.js';
import {
  createTestMigration,
  createTestPluginImplementationStore,
  createTestPluginMetadata,
} from '#src/plugins/plugins.test-utils.js';

import { PluginUtils } from './plugin-utils.js';

describe('PluginUtils.setPluginConfig', () => {
  test('should set configSchemaVersion when adding new plugin', () => {
    const projectDefinition = createTestProjectDefinition();

    const mockPlugin = createTestPluginMetadata({
      id: 'test-plugin',
      name: 'TestPlugin',
      packageName: '@test/plugin',
    });

    // Create plugin implementation store with migrations
    const pluginImplementationStore = createTestPluginImplementationStore({
      'test-plugin': [
        createTestMigration(1, 'test-migration-1'),
        createTestMigration(2, 'test-migration-2'),
      ],
    });

    // Set plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { setting: 'value' },
      pluginImplementationStore,
    );

    // Verify plugin was added with correct schema version
    expect(projectDefinition.plugins).toHaveLength(1);
    expect(projectDefinition.plugins?.[0]).toMatchObject({
      id: 'plugin:test-plugin',
      name: 'TestPlugin',
      packageName: '@test/plugin',
      config: { setting: 'value' },
      configSchemaVersion: 2, // Should be set to latest migration version
    });
  });

  test('should set configSchemaVersion to undefined when no migrations exist', () => {
    const projectDefinition = createTestProjectDefinition();

    const mockPlugin = createTestPluginMetadata({
      id: 'no-migrations-plugin',
      name: 'NoMigrationsPlugin',
      packageName: '@test/no-migrations',
    });

    // Create plugin implementation store without migrations
    const pluginImplementationStore = createTestPluginImplementationStore();

    // Set plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { setting: 'value' },
      pluginImplementationStore,
    );

    // Verify plugin was added with undefined schema version
    expect(projectDefinition.plugins).toHaveLength(1);
    expect(projectDefinition.plugins?.[0]).toMatchObject({
      id: 'plugin:no-migrations-plugin',
      name: 'NoMigrationsPlugin',
      packageName: '@test/no-migrations',
      config: { setting: 'value' },
      configSchemaVersion: undefined,
    });
  });

  test('should update existing plugin config and preserve schema version', () => {
    const projectDefinition = createTestProjectDefinition({
      plugins: [
        {
          id: 'plugin:existing-plugin',
          name: 'ExistingPlugin',
          packageName: '@test/existing',
          version: '1.0.0',
          config: { oldSetting: 'oldValue' },
          configSchemaVersion: 5,
        },
      ],
    });

    const mockPlugin = createTestPluginMetadata({
      id: 'existing-plugin',
      name: 'ExistingPlugin',
      packageName: '@test/existing',
    });

    const pluginImplementationStore = createTestPluginImplementationStore();

    // Update plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { newSetting: 'newValue' },
      pluginImplementationStore,
    );

    // Verify plugin was updated but still only one plugin exists
    expect(projectDefinition.plugins).toHaveLength(1);
    expect(projectDefinition.plugins?.[0]).toMatchObject({
      id: 'plugin:existing-plugin',
      name: 'ExistingPlugin',
      packageName: '@test/existing',
      config: { newSetting: 'newValue' },
      configSchemaVersion: 5, // Should preserve existing schema version when updating
    });
  });
});
