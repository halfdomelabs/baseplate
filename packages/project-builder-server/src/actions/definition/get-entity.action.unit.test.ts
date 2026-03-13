import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { getEntityAction } from './get-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

describe('get-entity', () => {
  test('should retrieve a model by ID', async ({ context, blogPostModel }) => {
    const result = await invokeServiceActionForTest(
      getEntityAction,
      { project: 'test-project', entityId: blogPostModel.id },
      context,
    );

    expect(result.entity).not.toBeNull();
    expect(result.entity).toHaveProperty('name', 'BlogPost');
  });

  test('should retrieve a nested scalar field by ID', async ({
    context,
    blogPostModel,
  }) => {
    const titleField = blogPostModel.model.fields.find(
      (f) => f.name === 'title',
    );
    if (!titleField) throw new Error('title field not found in fixture');

    const result = await invokeServiceActionForTest(
      getEntityAction,
      { project: 'test-project', entityId: titleField.id },
      context,
    );

    expect(result.entity).not.toBeNull();
    expect(result.entity).toHaveProperty('name', 'title');
    expect(result.entity).toHaveProperty('type', 'string');
  });

  test('should return null for a nonexistent entity ID', async ({
    context,
  }) => {
    const result = await invokeServiceActionForTest(
      getEntityAction,
      { project: 'test-project', entityId: 'model:nonexistent' },
      context,
    );

    expect(result.entity).toBeNull();
  });
});
