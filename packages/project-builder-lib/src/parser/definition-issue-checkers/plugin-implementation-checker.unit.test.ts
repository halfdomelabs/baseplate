import { describe, expect, it } from 'vitest';

import { pluginEntityType } from '#src/schema/plugins/entity-types.js';
import {
  createMockPluginMetadata,
  createMockPluginStore,
  createTestProjectDefinitionContainer,
} from '#src/testing/index.js';

import { checkPluginImplementations } from './plugin-implementation-checker.js';

describe('checkPluginImplementations', () => {
  it('returns no issues for plugins without managed plugins', () => {
    const storageMetadata = createMockPluginMetadata(
      'storage',
      '@test/plugin-storage:storage',
    );
    const pluginStore = createMockPluginStore([storageMetadata]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('storage'),
          name: 'storage',
          packageName: '@test/plugin-storage',
          version: '0.1.0',
          config: {},
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginImplementations(container);
    expect(issues).toEqual([]);
  });

  it('returns no issues when implementation is selected and enabled', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const localAuthMetadata = createMockPluginMetadata(
      'local-auth',
      '@test/plugin-auth:local-auth',
      { managedBy: '@test/plugin-auth:auth' },
    );
    const pluginStore = createMockPluginStore([
      authMetadata,
      localAuthMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: { implementationPluginKey: 'local-auth' },
        },
        {
          id: pluginEntityType.idFromKey('local-auth'),
          name: 'local-auth',
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

    const issues = checkPluginImplementations(container);
    expect(issues).toEqual([]);
  });

  it('returns warning when implementation is not selected', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const localAuthMetadata = createMockPluginMetadata(
      'local-auth',
      '@test/plugin-auth:local-auth',
      { managedBy: '@test/plugin-auth:auth' },
    );
    const pluginStore = createMockPluginStore([
      authMetadata,
      localAuthMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: { implementationPluginKey: '' },
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginImplementations(container);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('requires an implementation');
    expect(issues[0]?.severity).toBe('warning');
  });

  it('returns warning when selected implementation is not enabled', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const localAuthMetadata = createMockPluginMetadata(
      'local-auth',
      '@test/plugin-auth:local-auth',
      { managedBy: '@test/plugin-auth:auth' },
    );
    const pluginStore = createMockPluginStore([
      authMetadata,
      localAuthMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: { implementationPluginKey: 'local-auth' },
        },
        // local-auth is NOT in the plugins array (not enabled)
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginImplementations(container);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('not enabled');
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.fix).toBeDefined();
    expect(issues[0]?.fix?.label).toContain('Enable');
  });

  it('skips plugins without implementationPluginKey in config', () => {
    const authMetadata = createMockPluginMetadata(
      'auth',
      '@test/plugin-auth:auth',
    );
    const localAuthMetadata = createMockPluginMetadata(
      'local-auth',
      '@test/plugin-auth:local-auth',
      { managedBy: '@test/plugin-auth:auth' },
    );
    const pluginStore = createMockPluginStore([
      authMetadata,
      localAuthMetadata,
    ]);

    const container = createTestProjectDefinitionContainer({
      plugins: [
        {
          id: pluginEntityType.idFromKey('auth'),
          name: 'auth',
          packageName: '@test/plugin-auth',
          version: '0.1.0',
          config: { someOtherField: 'value' },
        },
      ],
    });
    container.parserContext = {
      ...container.parserContext,
      pluginStore,
    };

    const issues = checkPluginImplementations(container);
    expect(issues).toEqual([]);
  });
});
