import { describe, expect, it } from 'vitest';

import type { PluginStore } from '#src/plugins/imports/types.js';
import type { PluginMetadataWithPaths } from '#src/plugins/index.js';

import { pluginEntityType } from '#src/schema/plugins/entity-types.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { checkPluginDependencies } from './plugin-dependency-checker.js';

function createMockPluginMetadata(
  key: string,
  fullyQualifiedName: string,
  pluginDependencies?: { plugin: string; optional?: boolean }[],
): PluginMetadataWithPaths {
  return {
    key,
    name: key,
    displayName: key.charAt(0).toUpperCase() + key.slice(1),
    description: `${key} plugin`,
    version: '0.1.0',
    packageName: `@test/plugin-${key}`,
    fullyQualifiedName,
    pluginDirectory: `/plugins/${key}`,
    webBuildDirectory: `/plugins/${key}/web`,
    nodeModulePaths: [],
    webModulePaths: [],
    pluginDependencies,
  };
}

function createPluginStoreWithPlugins(
  pluginMetadata: PluginMetadataWithPaths[],
): PluginStore {
  return {
    availablePlugins: pluginMetadata.map((metadata) => ({
      metadata,
      modules: [],
    })),
    coreModules: [],
  };
}

describe('checkPluginDependencies', () => {
  it('returns no issues for plugins with no dependencies', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const pluginStore = createPluginStoreWithPlugins([authMetadata]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginDependencies(container);
    expect(issues).toEqual([]);
  });

  it('returns no issues when all required dependencies are enabled', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const rateLimitMetadata = createMockPluginMetadata(
      'rate-limit',
      '@test/plugin-rate-limit:rate-limit',
      [{ plugin: '@test/plugin-auth:auth' }],
    );
    const pluginStore = createPluginStoreWithPlugins([
      authMetadata,
      rateLimitMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: {},
        },
        {
          id: pluginEntityType.idFromKey('rate-limit'),
          name: 'rate-limit',
          packageName: '@test/plugin-rate-limit',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginDependencies(container);
    expect(issues).toEqual([]);
  });

  it('returns an error when a required dependency is not enabled', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const rateLimitMetadata = createMockPluginMetadata(
      'rate-limit',
      '@test/plugin-rate-limit:rate-limit',
      [{ plugin: '@test/plugin-auth:auth' }],
    );
    const pluginStore = createPluginStoreWithPlugins([
      authMetadata,
      rateLimitMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('rate-limit'),
          name: 'rate-limit',
          packageName: '@test/plugin-rate-limit',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginDependencies(container);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('Rate-limit');
    expect(issues[0]?.message).toContain('Auth');
    expect(issues[0]?.severity).toBe('error');
    expect(issues[0]?.fix).toBeDefined();
    expect(issues[0]?.fix?.label).toContain('Enable Auth');
  });

  it('does not return issues for optional dependencies', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const rateLimitMetadata = createMockPluginMetadata(
      'rate-limit',
      '@test/plugin-rate-limit:rate-limit',
      [{ plugin: '@test/plugin-auth:auth', optional: true }],
    );
    const pluginStore = createPluginStoreWithPlugins([
      authMetadata,
      rateLimitMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('rate-limit'),
          name: 'rate-limit',
          packageName: '@test/plugin-rate-limit',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginDependencies(container);
    expect(issues).toEqual([]);
  });

  it('returns no issues when dependency plugin is not available (uninstalled)', () => {
    const rateLimitMetadata = createMockPluginMetadata(
      'rate-limit',
      '@test/plugin-rate-limit:rate-limit',
      [{ plugin: '@test/plugin-missing:missing' }],
    );
    const pluginStore = createPluginStoreWithPlugins([rateLimitMetadata]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('rate-limit'),
          name: 'rate-limit',
          packageName: '@test/plugin-rate-limit',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    // Unavailable deps are skipped (plugin may be uninstalled)
    const issues = checkPluginDependencies(container);
    expect(issues).toEqual([]);
  });

  it('returns multiple issues for multiple unmet dependencies', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const storageMetadata = createMockPluginMetadata(
      'storage',
      '@test/plugin-storage:storage',
    );
    const appMetadata = createMockPluginMetadata(
      'app',
      '@test/plugin-app:app',
      [
        { plugin: '@test/plugin-auth:auth' },
        { plugin: '@test/plugin-storage:storage' },
      ],
    );
    const pluginStore = createPluginStoreWithPlugins([
      authMetadata,
      storageMetadata,
      appMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('app'),
          name: 'app',
          packageName: '@test/plugin-app',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginDependencies(container);
    expect(issues).toHaveLength(2);
    expect(issues[0]?.message).toContain('Auth');
    expect(issues[1]?.message).toContain('Storage');
  });
});
