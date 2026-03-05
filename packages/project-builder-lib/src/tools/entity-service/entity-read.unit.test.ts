import { assert, describe, expect, it } from 'vitest';

import type { createTestProjectDefinitionInput } from '#src/testing/project-definition-container.test-helper.js';

import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import type { EntityServiceContext } from './types.js';

import { getEntity, listEntities } from './entity-read.js';

function createTestContext(
  input: Parameters<typeof createTestProjectDefinitionInput>[0] = {},
): EntityServiceContext {
  return createTestProjectDefinitionContainer(input).toEntityServiceContext();
}

describe('listEntities', () => {
  it('should list top-level entities', () => {
    const feature = createTestFeature({ name: 'billing' });
    const context = createTestContext({ features: [feature] });

    const result = listEntities({ entityTypeName: 'feature' }, context);

    expect(result).toEqual([
      { id: feature.id, name: 'billing', type: 'feature' },
    ]);
  });

  it('should list multiple entities', () => {
    const feature1 = createTestFeature({ name: 'billing' });
    const feature2 = createTestFeature({ name: 'auth' });
    const context = createTestContext({
      features: [feature1, feature2],
    });

    const result = listEntities({ entityTypeName: 'feature' }, context);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('billing');
    expect(result[1].name).toBe('auth');
  });

  it('should return empty array when no entities exist', () => {
    const context = createTestContext();

    const result = listEntities({ entityTypeName: 'feature' }, context);

    expect(result).toEqual([]);
  });

  it('should list nested entities with parent ID', () => {
    const feature = createTestFeature({ name: 'billing' });
    const nameField = createTestScalarField({ name: 'name', type: 'string' });
    const model = createTestModel({
      name: 'Invoice',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          }),
          nameField,
        ],
        primaryKeyFieldRefs: ['id'],
      },
    });
    const context = createTestContext({
      features: [feature],
      models: [model],
    });

    const result = listEntities(
      {
        entityTypeName: 'model-scalar-field',
        parentEntityId: model.id,
      },
      context,
    );

    // Model has an id field and a name field
    expect(result.length).toBeGreaterThanOrEqual(2);
    const fieldNames = result.map((stub) => stub.name);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('name');
  });

  it('should throw for unknown entity type', () => {
    const context = createTestContext();

    expect(() =>
      listEntities({ entityTypeName: 'nonexistent' }, context),
    ).toThrow('Unknown entity type: nonexistent');
  });

  it('should throw for nested entity type without parent ID', () => {
    const feature = createTestFeature({ name: 'billing' });
    const model = createTestModel({
      name: 'Invoice',
      featureRef: feature.name,
    });
    const context = createTestContext({
      features: [feature],
      models: [model],
    });

    expect(() =>
      listEntities({ entityTypeName: 'model-scalar-field' }, context),
    ).toThrow(/requires a parent entity ID/);
  });
});

describe('getEntity', () => {
  it('should get an entity by ID', () => {
    const feature = createTestFeature({ name: 'billing' });
    const context = createTestContext({ features: [feature] });

    const result = getEntity(feature.id, context);

    assert(result);
    expect(result.name).toBe('billing');
  });

  it('should return undefined for nonexistent entity ID', () => {
    const context = createTestContext();

    const result = getEntity('feature:nonexistent', context);

    expect(result).toBeUndefined();
  });

  it('should get a nested entity by ID', () => {
    const feature = createTestFeature({ name: 'billing' });
    const nameField = createTestScalarField({ name: 'title', type: 'string' });
    const model = createTestModel({
      name: 'Post',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          }),
          nameField,
        ],
        primaryKeyFieldRefs: ['id'],
      },
    });
    const context = createTestContext({
      features: [feature],
      models: [model],
    });

    const result = getEntity(nameField.id, context);

    assert(result);
    expect(result.name).toBe('title');
  });
});
