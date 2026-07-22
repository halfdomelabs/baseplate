import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { stagePatchEntityAction } from './stage-patch-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

beforeEach(() => {
  vol.reset();
});

describe('stage-patch-entity', () => {
  test('should stage a partial model update preserving omitted fields', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const result = await invokeServiceActionForTest(
      stagePatchEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model',
        entityId: blogPostModel.id,
        entityData: { name: 'BlogPostPatched' },
      },
      context,
    );

    expect(result.message).toContain('Staged patch');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: {
        name: string;
        featureRef: string;
        model: { fields: { name: string }[] };
      }[];
    };
    const patchedModel = definition.models.find(
      (m) => m.name === 'BlogPostPatched',
    );
    expect(patchedModel).toBeDefined();
    // Omitted root fields should be preserved
    expect(patchedModel?.featureRef).toBe('blog');
    expect(patchedModel?.model.fields.map((f) => f.name)).toEqual(
      blogPostModel.model.fields.map((f) => f.name),
    );
  });
});
