import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeServiceActionAsCli } from '#src/actions/utils/cli.js';

import type { DraftSessionContext } from './draft-session.js';

import {
  createTestActionContext,
  createTestEntityServiceContext,
} from '../__tests__/action-test-utils.js';
import { getOrCreateDraftSession } from './draft-session.js';
import { getEntitySchemaAction } from './get-entity-schema.action.js';
import { getEntityAction } from './get-entity.action.js';
import { listEntitiesAction } from './list-entities.action.js';
import { listEntityTypesAction } from './list-entity-types.action.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';
import { stageCreateEntityAction } from './stage-create-entity.action.js';
import { stageDeleteEntityAction } from './stage-delete-entity.action.js';
import { stageUpdateEntityAction } from './stage-update-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

// Only mock getOrCreateDraftSession — let saveDraftSession use memfs
vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return {
    ...actual,
    getOrCreateDraftSession: vi.fn(),
  };
});

// -- Test fixtures -----------------------------------------------------------

const blogFeature = createTestFeature({ name: 'blog' });

const titleField = createTestScalarField({ name: 'title', type: 'string' });
const contentField = createTestScalarField({ name: 'content', type: 'string' });

const blogPostModel = createTestModel({
  name: 'BlogPost',
  featureRef: blogFeature.name,
  model: {
    fields: [
      createTestScalarField({
        name: 'id',
        type: 'uuid',
        options: { genUuid: true },
      }),
      titleField,
      contentField,
    ],
    primaryKeyFieldRefs: ['id'],
  },
});

const testEntityServiceContext = createTestEntityServiceContext({
  features: [blogFeature],
  models: [blogPostModel],
});

const PROJECT_DIR = '/test-project';

const context = createTestActionContext();

function createMockDraftSessionContext(): DraftSessionContext {
  return {
    session: {
      sessionId: 'default',
      definitionHash: 'test-hash',
      draftDefinition:
        testEntityServiceContext.entityContext.serializedDefinition,
    },
    entityContext: testEntityServiceContext.entityContext,
    parserContext: testEntityServiceContext.parserContext,
    projectDirectory: PROJECT_DIR,
  };
}

// -- Setup -------------------------------------------------------------------

beforeEach(() => {
  vol.reset();
  vi.mocked(loadEntityServiceContext).mockResolvedValue(
    testEntityServiceContext,
  );
  vi.mocked(getOrCreateDraftSession).mockResolvedValue(
    createMockDraftSessionContext(),
  );
});

// -- Read action tests -------------------------------------------------------

describe('list-entity-types', () => {
  it('should return available entity types', async () => {
    const result = await invokeServiceActionAsCli(
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

describe('list-entities', () => {
  it('should list features', async () => {
    const result = await invokeServiceActionAsCli(
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

  it('should list models', async () => {
    const result = await invokeServiceActionAsCli(
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

  it('should list nested model fields with parent ID', async () => {
    const result = await invokeServiceActionAsCli(
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

describe('get-entity', () => {
  it('should retrieve a model by ID', async () => {
    const result = await invokeServiceActionAsCli(
      getEntityAction,
      { project: 'test-project', entityId: blogPostModel.id },
      context,
    );

    expect(result.entity).not.toBeNull();
    expect(result.entity).toHaveProperty('name', 'BlogPost');
  });

  it('should return null for a nonexistent entity ID', async () => {
    const result = await invokeServiceActionAsCli(
      getEntityAction,
      { project: 'test-project', entityId: 'model:nonexistent' },
      context,
    );

    expect(result.entity).toBeNull();
  });
});

describe('get-entity-schema', () => {
  it('should return TypeScript type for a known entity type', async () => {
    const result = await invokeServiceActionAsCli(
      getEntitySchemaAction,
      { project: 'test-project', entityTypeName: 'model' },
      context,
    );

    expect(result.entityTypeName).toBe('model');
    expect(typeof result.schema).toBe('string');
    expect(result.schema).toContain('name');
  });

  it('should throw for an unknown entity type', async () => {
    await expect(
      invokeServiceActionAsCli(
        getEntitySchemaAction,
        { project: 'test-project', entityTypeName: 'nonexistent' },
        context,
      ),
    ).rejects.toThrow(/Unknown entity type/);
  });
});

// -- Write action tests ------------------------------------------------------

describe('stage-create-entity', () => {
  it('should stage a new feature and write draft files to disk', async () => {
    const result = await invokeServiceActionAsCli(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );

    expect(result.message).toContain('Staged creation');

    // Verify draft files were written via memfs
    const sessionContents = await readFile(
      `${PROJECT_DIR}/baseplate/.build/draft-session.json`,
      'utf-8',
    );
    const session = JSON.parse(sessionContents) as {
      sessionId: string;
      definitionHash: string;
    };
    expect(session.sessionId).toBe('default');
    expect(session.definitionHash).toBe('test-hash');

    const defContents = await readFile(
      `${PROJECT_DIR}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      features: { name: string }[];
    };
    // The new feature should be in the draft definition
    expect(definition.features.some((f) => f.name === 'payments')).toBe(true);
  });
});

describe('stage-update-entity', () => {
  it('should stage an entity update and write draft files', async () => {
    const result = await invokeServiceActionAsCli(
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
      `${PROJECT_DIR}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: { name: string }[];
    };
    expect(definition.models.some((m) => m.name === 'BlogPostUpdated')).toBe(
      true,
    );
  });
});

describe('stage-delete-entity', () => {
  it('should stage an entity deletion and write draft files', async () => {
    const result = await invokeServiceActionAsCli(
      stageDeleteEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityId: blogFeature.id,
      },
      context,
    );

    expect(result.message).toContain('Staged deletion');

    const defContents = await readFile(
      `${PROJECT_DIR}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      features: { name: string }[];
    };
    expect(definition.features.some((f) => f.name === 'blog')).toBe(false);
  });
});
