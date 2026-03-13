import { describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { searchEntitiesAction } from './search-entities.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

describe('search-entities', () => {
  test('should find a model by name substring', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      searchEntitiesAction,
      { project: 'test-project', query: 'Blog' },
      context,
    );

    const names = result.results.map((r: { name: string }) => r.name);
    expect(names).toContain('BlogPost');
  });

  test('should find a nested scalar field by name', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      searchEntitiesAction,
      { project: 'test-project', query: 'title' },
      context,
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      name: 'title',
      type: 'model-scalar-field',
    });
  });

  test('should filter by entity type', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      searchEntitiesAction,
      {
        project: 'test-project',
        query: 'BlogPost',
        entityTypeName: 'feature',
      },
      context,
    );

    // BlogPost is a model, not a feature — should not match
    expect(result.results).toHaveLength(0);
  });

  test('should return empty results for no match', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      searchEntitiesAction,
      { project: 'test-project', query: 'nonexistent' },
      context,
    );

    expect(result.results).toHaveLength(0);
  });

  test('should be case-insensitive', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      searchEntitiesAction,
      { project: 'test-project', query: 'blogpost' },
      context,
    );

    const names = result.results.map((r: { name: string }) => r.name);
    expect(names).toContain('BlogPost');
  });
});
