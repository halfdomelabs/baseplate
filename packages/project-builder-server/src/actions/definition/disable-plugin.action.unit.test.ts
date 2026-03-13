import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { disablePluginAction } from './disable-plugin.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return {
    ...actual,
    getOrCreateDraftSession: vi.fn(),
  };
});

describe('disablePluginAction', () => {
  test('throws when plugin is not currently enabled', async ({ context }) => {
    await expect(
      invokeServiceActionForTest(
        disablePluginAction,
        { project: 'test-project', pluginKey: 'nonexistent' },
        context,
      ),
    ).rejects.toThrow('Plugin "nonexistent" is not currently enabled');
  });
});
