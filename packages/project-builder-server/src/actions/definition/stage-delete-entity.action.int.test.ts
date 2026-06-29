import {
  createTestFeature,
  createTestModel,
  createTestRelationField,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, vi } from 'vitest';

import type { DraftSessionContext } from './draft-session.js';

import {
  createTestActionContext,
  createTestEntityServiceContext,
  invokeServiceActionForTest,
} from '../__tests__/action-test-utils.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { getOrCreateDraftSession } from './draft-session.js';
import { stageDeleteEntityAction } from './stage-delete-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return { ...actual, getOrCreateDraftSession: vi.fn() };
});

beforeEach(() => {
  vol.reset();
});

describe('stage-delete-entity', () => {
  test('should stage a model deletion and write draft files', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const result = await invokeServiceActionForTest(
      stageDeleteEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model',
        entityId: blogPostModel.id,
      },
      context,
    );

    expect(result.message).toContain('Staged deletion');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { name: string }[];
    };
    expect(definition.models.some((m) => m.name === 'BlogPost')).toBe(false);
  });

  test('should stage a nested scalar field deletion', async ({
    context,
    blogPostModel,
    projectDir,
  }) => {
    const titleField = blogPostModel.model.fields.find(
      (f) => f.name === 'title',
    );
    if (!titleField) throw new Error('title field not found in fixture');

    const result = await invokeServiceActionForTest(
      stageDeleteEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model-scalar-field',
        entityId: titleField.id,
      },
      context,
    );

    expect(result.message).toContain('Staged deletion');

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { model: { fields: { name: string }[] } }[];
    };
    const blogPost = definition.models[0];
    const fieldNames = blogPost.model.fields.map((f) => f.name);
    expect(fieldNames).not.toContain('title');
    expect(fieldNames).toContain('content');
  });

  test('should cascade-delete relations on other models that reference the deleted model', async ({
    projectDir,
  }) => {
    // Two mutually-referencing models: deleting either should not be blocked by
    // the other's relation (modelRef has onDelete: RESTRICT). The cascade should
    // remove the incoming relation first, then the model.
    const feature = createTestFeature({ name: 'blog' });

    const userModel = createTestModel({
      name: 'User',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({ name: 'id', type: 'uuid' }),
          createTestScalarField({ name: 'postId', type: 'uuid' }),
        ],
        primaryKeyFieldRefs: ['id'],
        relations: [
          createTestRelationField({
            name: 'post',
            modelRef: 'Post',
            foreignRelationName: 'author',
            references: [{ localRef: 'postId', foreignRef: 'id' }],
          }),
        ],
      },
    });

    const postModel = createTestModel({
      name: 'Post',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({ name: 'id', type: 'uuid' }),
          createTestScalarField({ name: 'userId', type: 'uuid' }),
        ],
        primaryKeyFieldRefs: ['id'],
        relations: [
          createTestRelationField({
            name: 'user',
            modelRef: 'User',
            foreignRelationName: 'posts',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
          }),
        ],
      },
    });

    const testEntityServiceContext = createTestEntityServiceContext({
      features: [feature],
      models: [userModel, postModel],
    });

    const draftSessionContext: DraftSessionContext = {
      session: {
        sessionId: 'default',
        definitionHash: 'test-hash',
        draftDefinition:
          testEntityServiceContext.entityContext.serializedDefinition,
      },
      entityContext: testEntityServiceContext.entityContext,
      container: testEntityServiceContext.container,
      oldRefPayload: testEntityServiceContext.container.refPayload,
      parserContext: testEntityServiceContext.parserContext,
      projectDirectory: projectDir,
    };
    vi.mocked(getOrCreateDraftSession).mockResolvedValue(draftSessionContext);

    const result = await invokeServiceActionForTest(
      stageDeleteEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'model',
        entityId: userModel.id,
      },
      createTestActionContext(),
    );

    // No throw means the RESTRICT block from Post.user -> User was cleared.
    expect(result.message).toContain('Staged deletion');

    // Warning reported for the cascaded relation on Post.
    expect(result.issues).toBeDefined();
    expect(
      result.issues?.some(
        (issue) =>
          issue.severity === 'warning' && issue.message.includes("'user'"),
      ),
    ).toBe(true);

    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: {
        name: string;
        model: { relations?: { name: string }[] };
      }[];
    };

    // User model is gone.
    expect(definition.models.some((m) => m.name === 'User')).toBe(false);

    // Post's relation that referenced User is gone.
    const post = definition.models.find((m) => m.name === 'Post');
    expect(post).toBeDefined();
    expect(post?.model.relations ?? []).toHaveLength(0);
  });
});
