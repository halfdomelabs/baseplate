import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, vi } from 'vitest';

import { invokeServiceActionForTest } from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { stageCreateEntityAction } from './stage-create-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

beforeEach(() => {
  vol.reset();
});

describe('stage-create-entity', () => {
  test('should stage a new feature and write draft files to disk', async ({
    context,
    projectDir,
  }) => {
    const result = await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );

    expect(result.message).toContain('Staged creation');

    const sessionContents = await readFile(
      `${projectDir}/baseplate/.build/draft-session.json`,
      'utf-8',
    );
    const session = JSON.parse(sessionContents) as {
      sessionId: string;
      definitionHash: string;
    };
    expect(session.sessionId).toBe('default');
    expect(session.definitionHash).toBe('test-hash');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      features: { name: string }[];
    };
    expect(definition.features.some((f) => f.name === 'payments')).toBe(true);
  });

  test('should stage a new model', async ({ context, projectDir }) => {
    const result = await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model',
        entityData: {
          name: 'Comment',
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

    expect(result.message).toContain('Staged creation');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { name: string }[];
    };
    expect(definition.models.some((m) => m.name === 'Comment')).toBe(true);
  });

  test('should stage a new nested scalar field on a model', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const result = await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model-scalar-field',
        entityData: { name: 'summary', type: 'string' },
        parentEntityId: blogPostModel.id,
      },
      context,
    );

    expect(result.message).toContain('Staged creation');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { model: { fields: { name: string }[] } }[];
    };
    const blogPost = definition.models.find(
      (m: { model: { fields: { name: string }[] } }) =>
        m.model.fields.some((f) => f.name === 'summary'),
    );
    expect(blogPost).toBeDefined();
  });
});
