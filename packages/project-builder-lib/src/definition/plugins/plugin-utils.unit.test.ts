import { describe, expect, test } from 'vitest';

import type { PluginConfigMigration } from '#src/plugins/spec/config-spec.js';
import type { BasePluginDefinition } from '#src/schema/plugins/definition.js';

import {
  createTestProjectDefinition,
  createTestProjectDefinitionContainer,
} from '#src/definition/project-definition-container.test-utils.js';
import { createPluginModule } from '#src/plugins/index.js';
import {
  createTestMigration,
  createTestPluginMetadata,
} from '#src/plugins/plugins.test-utils.js';
import { pluginConfigSpec } from '#src/plugins/spec/config-spec.js';

import { PluginUtils } from './plugin-utils.js';

/**
 * Creates a test ProjectDefinitionContainer with plugins available in the parserContext.pluginStore.
 * When a plugin is added, its module will be initialized and migrations registered.
 */
function createTestContainerWithAvailablePlugins(
  availablePlugins: {
    metadata: ReturnType<typeof createTestPluginMetadata>;
    migrations?: PluginConfigMigration[];
  }[],
  existingPlugins?: BasePluginDefinition[],
): ReturnType<typeof createTestProjectDefinitionContainer> {
  const container = createTestProjectDefinitionContainer({
    plugins: existingPlugins,
  });

  // Add available plugins to the parserContext.pluginStore
  // These plugins will be used when createPluginImplementationStoreWithNewPlugins is called
  container.parserContext.pluginStore.availablePlugins = availablePlugins.map(
    ({ metadata, migrations = [] }) => ({
      metadata,
      modules: [
        {
          key: `${metadata.key}/common`,
          pluginKey: metadata.key,
          directory: 'common',
          module: createPluginModule({
            name: 'common',
            dependencies: { pluginConfig: pluginConfigSpec },
            initialize: (deps, { pluginKey }) => {
              if (migrations.length > 0) {
                deps.pluginConfig.migrations.set(pluginKey, migrations);
              }
            },
          }),
        },
      ],
    }),
  );

  return container;
}

describe('PluginUtils.setPluginConfig', () => {
  test('should set configSchemaVersion when adding new plugin', () => {
    const projectDefinition = createTestProjectDefinition();

    const mockPlugin = createTestPluginMetadata({
      key: 'test-plugin',
      name: 'TestPlugin',
      packageName: '@test/plugin',
    });

    // Create container with plugin available in pluginStore (with migrations)
    const container = createTestContainerWithAvailablePlugins([
      {
        metadata: mockPlugin,
        migrations: [
          createTestMigration(1, 'test-migration-1'),
          createTestMigration(2, 'test-migration-2'),
        ],
      },
    ]);

    // Set plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { setting: 'value' },
      container,
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
      key: 'no-migrations-plugin',
      name: 'NoMigrationsPlugin',
      packageName: '@test/no-migrations',
    });

    // Create container with plugin available but no migrations
    const container = createTestContainerWithAvailablePlugins([
      {
        metadata: mockPlugin,
        migrations: [],
      },
    ]);

    // Set plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { setting: 'value' },
      container,
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
    const mockPlugin = createTestPluginMetadata({
      key: 'existing-plugin',
      name: 'ExistingPlugin',
      packageName: '@test/existing',
    });

    // Create container with existing plugin in definition
    const container = createTestContainerWithAvailablePlugins(
      [{ metadata: mockPlugin }],
      [
        {
          id: 'plugin:existing-plugin',
          name: 'ExistingPlugin',
          packageName: '@test/existing',
          version: '1.0.0',
          config: { oldSetting: 'oldValue' },
          configSchemaVersion: 5,
        },
      ],
    );

    // Use a mutable copy of the definition for the update
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

    // Update plugin config
    PluginUtils.setPluginConfig(
      projectDefinition,
      mockPlugin,
      { newSetting: 'newValue' },
      container,
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
