import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';

import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { listPluginsAction } from './list-plugins.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return {
    ...actual,
    getOrCreateDraftSession: vi.fn(),
  };
});

function createTestPlugin(
  overrides: Partial<PluginMetadataWithPaths> & { key: string; name: string },
): PluginMetadataWithPaths {
  return {
    displayName: overrides.name,
    description: `${overrides.name} plugin`,
    version: '1.0.0',
    packageName: `@baseplate-dev/plugin-${overrides.name}`,
    fullyQualifiedName: `@baseplate-dev/plugin-${overrides.name}:${overrides.name}`,
    pluginDirectory: `/plugins/${overrides.name}`,
    webBuildDirectory: `/plugins/${overrides.name}/web`,
    nodeModulePaths: [],
    webModulePaths: [],
    ...overrides,
  };
}

describe('listPluginsAction', () => {
  test('lists available plugins with enabled/disabled status', async ({
    context,
  }) => {
    const plugins = [
      createTestPlugin({ key: 'auth', name: 'auth' }),
      createTestPlugin({ key: 'email', name: 'email' }),
    ];
    context.plugins = plugins;

    const result = await invokeServiceActionForTest(
      listPluginsAction,
      { project: 'test-project' },
      context,
    );

    expect(result.plugins).toHaveLength(2);
    expect(result.plugins[0]).toMatchObject({
      key: 'auth',
      name: 'auth',
      enabled: false,
    });
    expect(result.plugins[1]).toMatchObject({
      key: 'email',
      name: 'email',
      enabled: false,
    });
  });

  test('filters out hidden plugins', async ({ context }) => {
    const plugins = [
      createTestPlugin({ key: 'auth', name: 'auth' }),
      createTestPlugin({ key: 'internal', name: 'internal', hidden: true }),
    ];
    context.plugins = plugins;

    const result = await invokeServiceActionForTest(
      listPluginsAction,
      { project: 'test-project' },
      context,
    );

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.key).toBe('auth');
  });

  test('includes managedBy metadata', async ({ context }) => {
    const plugins = [
      createTestPlugin({
        key: 'better-auth',
        name: 'better-auth',
        managedBy: '@baseplate-dev/plugin-auth:auth',
      }),
    ];
    context.plugins = plugins;

    const result = await invokeServiceActionForTest(
      listPluginsAction,
      { project: 'test-project' },
      context,
    );

    expect(result.plugins[0]?.managedBy).toBe(
      '@baseplate-dev/plugin-auth:auth',
    );
  });
});
