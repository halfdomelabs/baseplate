import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { listEntitiesAction } from './list-entities.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

describe('list-entities', () => {
  test('should list features', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      listEntitiesAction,
      { project: 'test-project', entityTypeName: 'feature' },
      context,
    );

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toMatchObject({
      name: 'blog',
      type: 'feature',
    });
  });

  test('should list models', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      listEntitiesAction,
      { project: 'test-project', entityTypeName: 'model' },
      context,
    );

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toMatchObject({
      name: 'BlogPost',
      type: 'model',
    });
  });

  test('should list nested model fields with parent ID', async ({
    context,
    blogPostModel,
  }) => {
    const result = await invokeServiceActionForTest(
      listEntitiesAction,
      {
        project: 'test-project',
        entityTypeName: 'model-scalar-field',
        parentEntityId: blogPostModel.id,
      },
      context,
    );

    const fieldNames = result.entities.map((e: { name: string }) => e.name);
    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('content');
  });
});
