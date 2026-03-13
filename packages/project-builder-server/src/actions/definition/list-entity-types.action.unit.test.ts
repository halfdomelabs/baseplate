import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { listEntityTypesAction } from './list-entity-types.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

describe('list-entity-types', () => {
  test('should return available entity types', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      listEntityTypesAction,
      { project: 'test-project' },
      context,
    );

    expect(result.entityTypes).toBeDefined();
    expect(result.entityTypes.length).toBeGreaterThan(0);

    const typeNames = result.entityTypes.map((t: { name: string }) => t.name);
    expect(typeNames).toContain('feature');
    expect(typeNames).toContain('model');
  });
});
