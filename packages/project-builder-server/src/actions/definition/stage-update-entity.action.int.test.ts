import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { stageUpdateEntityAction } from './stage-update-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

beforeEach(() => {
  vol.reset();
});

describe('stage-update-entity', () => {
  test('should stage a model update and write draft files', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const result = await invokeServiceActionForTest(
      stageUpdateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model',
        entityId: blogPostModel.id,
        entityData: {
          id: blogPostModel.id,
          name: 'BlogPostUpdated',
          featureRef: 'blog',
          model: {
            fields: [
              {
                name: 'id',
                type: 'uuid',
                isOptional: false,
                options: { genUuid: true },
              },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      },
      context,
    );

    expect(result.message).toContain('Staged update');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { name: string }[];
    };
    expect(definition.models.some((m) => m.name === 'BlogPostUpdated')).toBe(
      true,
    );
  });

  test('should stage a nested scalar field update', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const titleField = blogPostModel.model.fields.find(
      (f) => f.name === 'title',
    );
    if (!titleField) throw new Error('title field not found in fixture');

    const result = await invokeServiceActionForTest(
      stageUpdateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model-scalar-field',
        entityId: titleField.id,
        entityData: {
          id: titleField.id,
          name: 'headline',
          type: 'string',
          isOptional: false,
        },
      },
      context,
    );

    expect(result.message).toContain('Staged update');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { model: { fields: { name: string }[] } }[];
    };
    const blogPost = definition.models[0];
    const fieldNames = blogPost.model.fields.map((f) => f.name);
    expect(fieldNames).toContain('headline');
    expect(fieldNames).not.toContain('title');
  });
});
