import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { getEntitySchemaAction } from './get-entity-schema.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

describe('get-entity-schema', () => {
  test('should return TypeScript type for a known entity type', async ({
    context,
  }) => {
    const result = await invokeServiceActionForTest(
      getEntitySchemaAction,
      { project: 'test-project', entityTypeName: 'model' },
      context,
    );

    expect(result.entityTypeName).toBe('model');
    expect(typeof result.schema).toBe('string');
    expect(result.schema).toContain('name');
  });

  test('should throw for an unknown entity type', async ({ context }) => {
    await expect(
      invokeServiceActionForTest(
        getEntitySchemaAction,
        { project: 'test-project', entityTypeName: 'nonexistent' },
        context,
      ),
    ).rejects.toThrow(/Unknown entity type/);
  });
});
