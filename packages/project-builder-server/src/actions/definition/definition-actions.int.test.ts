import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeServiceActionAsCli } from '#src/actions/utils/cli.js';

import {
  createTestActionContext,
  createTestEntityServiceContext,
} from '../__tests__/action-test-utils.js';
import { getEntitySchemaAction } from './get-entity-schema.action.js';
import { getEntityAction } from './get-entity.action.js';
import { listEntitiesAction } from './list-entities.action.js';
import { listEntityTypesAction } from './list-entity-types.action.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

vi.mock('./load-entity-service-context.js');

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

const context = createTestActionContext();

// -- Setup -------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(loadEntityServiceContext).mockResolvedValue(
    testEntityServiceContext,
  );
});

// -- Tests -------------------------------------------------------------------

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
  it('should return JSON schema for a known entity type', async () => {
    const result = await invokeServiceActionAsCli(
      getEntitySchemaAction,
      { project: 'test-project', entityTypeName: 'model' },
      context,
    );

    expect(result.entityTypeName).toBe('model');
    expect(result.schema).toBeDefined();
    expect(typeof result.schema).toBe('object');
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
