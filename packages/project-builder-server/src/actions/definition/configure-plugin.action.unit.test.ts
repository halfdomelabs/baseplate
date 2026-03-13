import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { configurePluginAction } from './configure-plugin.action.js';
import { test } from './definition-test-fixtures.test-helper.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return {
    ...actual,
    getOrCreateDraftSession: vi.fn(),
  };
});

describe('configurePluginAction', () => {
  test('throws when plugin key is not found', async ({ context }) => {
    context.plugins = [];

    await expect(
      invokeServiceActionForTest(
        configurePluginAction,
        { project: 'test-project', pluginKey: 'nonexistent' },
        context,
      ),
    ).rejects.toThrow('Plugin "nonexistent" not found');
  });

  test('error message lists available plugins', async ({ context }) => {
    context.plugins = [
      {
        key: 'auth',
        name: 'auth',
        displayName: 'Auth',
        description: 'Auth plugin',
        version: '1.0.0',
        packageName: '@baseplate-dev/plugin-auth',
        fullyQualifiedName: '@baseplate-dev/plugin-auth:auth',
        pluginDirectory: '/plugins/auth',
        webBuildDirectory: '/plugins/auth/web',
        nodeModulePaths: [],
        webModulePaths: [],
      },
    ];

    await expect(
      invokeServiceActionForTest(
        configurePluginAction,
        { project: 'test-project', pluginKey: 'nonexistent' },
        context,
      ),
    ).rejects.toThrow('Available plugins: auth');
  });
});
