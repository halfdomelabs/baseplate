import { describe, expect, it, test } from 'vitest';

import type { PluginConfigMigration } from '#src/plugins/spec/config-spec.js';
import type { BasePluginDefinition } from '#src/schema/plugins/definition.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { createPluginModule } from '#src/plugins/index.js';
import {
  createTestMigration,
  createTestPluginMetadata,
} from '#src/plugins/plugins.test-utils.js';
import { pluginConfigSpec } from '#src/plugins/spec/config-spec.js';
import { pluginEntityType } from '#src/schema/plugins/entity-types.js';
import {
  createMockPluginMetadata,
  createMockPluginStore,
} from '#src/testing/plugin-store.test-helper.js';
import {
  createTestProjectDefinition,
  createTestProjectDefinitionContainer,
} from '#src/testing/project-definition-container.test-helper.js';

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

describe('PluginUtils.getDependentPlugins', () => {
  function pluginDef(key: string): BasePluginDefinition {
    return {
      id: pluginEntityType.idFromKey(key),
      name: key,
      packageName: `@test/plugin-${key}`,
      version: '0.1.0',
      config: {},
    };
  }

  it('returns direct dependents', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const storageMetadata = createMockPluginMetadata(
      'storage',
      '@test/plugin-storage:storage',
      { pluginDependencies: [{ plugin: '@test/plugin-auth:auth' }] },
    );
    const pluginStore = createMockPluginStore([authMetadata, storageMetadata]);

    const result = PluginUtils.getDependentPlugins(
      {
        plugins: [pluginDef('auth'), pluginDef('storage')],
      } as ProjectDefinition,
      'auth',
      pluginStore,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('storage');
  });

  it('returns transitive dependents (A → B → C, disabling C returns B and A)', () => {
    const cMetadata = createMockPluginMetadata('c', '@test/plugin-c:c');
    const bMetadata = createMockPluginMetadata('b', '@test/plugin-b:b', {
      pluginDependencies: [{ plugin: '@test/plugin-c:c' }],
    });
    const aMetadata = createMockPluginMetadata('a', '@test/plugin-a:a', {
      pluginDependencies: [{ plugin: '@test/plugin-b:b' }],
    });
    const pluginStore = createMockPluginStore([
      aMetadata,
      bMetadata,
      cMetadata,
    ]);

    const result = PluginUtils.getDependentPlugins(
      {
        plugins: [pluginDef('a'), pluginDef('b'), pluginDef('c')],
      } as ProjectDefinition,
      'c',
      pluginStore,
    );

    expect(result).toHaveLength(2);
    const keys = result.map((r) => r.key).toSorted();
    expect(keys).toEqual(['a', 'b']);
  });

  it('excludes optional dependents from transitive results', () => {
    const cMetadata = createMockPluginMetadata('c', '@test/plugin-c:c');
    const bMetadata = createMockPluginMetadata('b', '@test/plugin-b:b', {
      pluginDependencies: [{ plugin: '@test/plugin-c:c' }],
    });
    // A optionally depends on B — should NOT be included
    const aMetadata = createMockPluginMetadata('a', '@test/plugin-a:a', {
      pluginDependencies: [{ plugin: '@test/plugin-b:b', optional: true }],
    });
    const pluginStore = createMockPluginStore([
      aMetadata,
      bMetadata,
      cMetadata,
    ]);

    const result = PluginUtils.getDependentPlugins(
      {
        plugins: [pluginDef('a'), pluginDef('b'), pluginDef('c')],
      } as ProjectDefinition,
      'c',
      pluginStore,
    );

    // Only B should be returned, not A (optional dep)
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('b');
  });

  it('returns empty array when no plugins depend on the target', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const storageMetadata = createMockPluginMetadata(
      'storage',
      '@test/plugin-storage:storage',
    );
    const pluginStore = createMockPluginStore([authMetadata, storageMetadata]);

    const result = PluginUtils.getDependentPlugins(
      {
        plugins: [pluginDef('auth'), pluginDef('storage')],
      } as ProjectDefinition,
      'auth',
      pluginStore,
    );

    expect(result).toEqual([]);
  });
});
