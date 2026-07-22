import { describe, expect, it } from 'vitest';

import {
  createTestFeature,
  createTestModel,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestEntityServiceContext } from '#src/testing/project-definition-container.test-helper.js';

import type { EntityServiceContext } from './types.js';

import { listEntities } from './entity-read.js';
import {
  createEntity,
  deleteEntity,
  patchEntity,
  updateEntity,
} from './entity-write.js';

describe('createEntity', () => {
  it('should create a top-level entity and return a new definition', () => {
    const context = createTestEntityServiceContext();

    const newDef = createEntity(
      {
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );

    // Original definition should not be modified
    const originalFeatures = context.serializedDefinition.features as unknown[];
    expect(originalFeatures).toHaveLength(0);

    // New definition should have the feature
    const newFeatures = newDef.features as Record<string, unknown>[];
    expect(newFeatures).toHaveLength(1);
    expect(newFeatures[0].name).toBe('payments');
    // Should have an assigned ID
    expect(newFeatures[0].id).toEqual(expect.stringContaining('feature:'));
  });

  it('should create a nested entity under a parent', () => {
    const feature = createTestFeature({ name: 'billing' });
    const model = createTestModel({
      name: 'Invoice',
      featureRef: feature.name,
    });
    const context = createTestEntityServiceContext({
      features: [feature],
      models: [model],
    });

    // Get the current field count
    const fieldsBefore = listEntities(
      { entityTypeName: 'model-scalar-field', parentEntityId: model.id },
      context,
    );

    const newDef = createEntity(
      {
        entityTypeName: 'model-scalar-field',
        entityData: { name: 'amount', type: 'int' },
        parentEntityId: model.id,
      },
      context,
    );

    // Use the new definition to list fields — need a fresh context
    const newContext: EntityServiceContext = {
      ...context,
      serializedDefinition: newDef,
    };
    const fieldsAfter = listEntities(
      { entityTypeName: 'model-scalar-field', parentEntityId: model.id },
      newContext,
    );

    expect(fieldsAfter.length).toBe(fieldsBefore.length + 1);
    const fieldNames = fieldsAfter.map((f) => f.name);
    expect(fieldNames).toContain('amount');
  });

  it('should throw for unknown entity type', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      createEntity(
        { entityTypeName: 'nonexistent', entityData: { name: 'test' } },
        context,
      ),
    ).toThrow('Unknown entity type: nonexistent');
  });
});

describe('updateEntity', () => {
  it('should update an existing entity', () => {
    const feature = createTestFeature({ name: 'billing' });
    const context = createTestEntityServiceContext({ features: [feature] });

    const newDef = updateEntity(
      {
        entityTypeName: 'feature',
        entityId: feature.id,
        entityData: { id: feature.id, name: 'payments' },
      },
      context,
    );

    // Original should be unchanged
    const origFeatures = context.serializedDefinition.features as Record<
      string,
      unknown
    >[];
    expect(origFeatures[0].name).toBe('billing');

    // New definition should have updated name
    const newFeatures = newDef.features as Record<string, unknown>[];
    expect(newFeatures[0].name).toBe('payments');
    // ID should be preserved
    expect(newFeatures[0].id).toBe(feature.id);
  });

  it('should throw for nonexistent entity ID', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      updateEntity(
        {
          entityTypeName: 'feature',
          entityId: 'feature:nonexistent',
          entityData: { name: 'test' },
        },
        context,
      ),
    ).toThrow(/not found/);
  });

  it('should throw for unknown entity type', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      updateEntity(
        {
          entityTypeName: 'nonexistent',
          entityId: 'nonexistent:123',
          entityData: { name: 'test' },
        },
        context,
      ),
    ).toThrow('Unknown entity type: nonexistent');
  });
});

describe('patchEntity', () => {
  it('should patch provided root fields and preserve the rest', () => {
    const feature = createTestFeature({ name: 'blog' });
    const model = createTestModel({
      name: 'BlogPost',
      featureRef: feature.name,
    });
    const context = createTestEntityServiceContext({
      features: [feature],
      models: [model],
    });

    const newDef = patchEntity(
      {
        entityTypeName: 'model',
        entityId: model.id,
        entityData: { name: 'Article' },
      },
      context,
    );

    // Original should be unchanged
    const origModels = context.serializedDefinition.models as Record<
      string,
      unknown
    >[];
    expect(origModels[0].name).toBe('BlogPost');

    const newModels = newDef.models as Record<string, unknown>[];
    expect(newModels[0].name).toBe('Article');
    expect(newModels[0].id).toBe(model.id);
    // Omitted root fields should be preserved
    expect(newModels[0].featureRef).toBe(feature.name);
    expect(newModels[0].model).toEqual(origModels[0].model);
  });

  it('should preserve the entity ID even if the patch supplies one', () => {
    const feature = createTestFeature({ name: 'billing' });
    const context = createTestEntityServiceContext({ features: [feature] });

    const newDef = patchEntity(
      {
        entityTypeName: 'feature',
        entityId: feature.id,
        entityData: { id: 'feature:other', name: 'payments' },
      },
      context,
    );

    const newFeatures = newDef.features as Record<string, unknown>[];
    expect(newFeatures[0].id).toBe(feature.id);
    expect(newFeatures[0].name).toBe('payments');
  });

  it('should replace nested fields wholesale rather than deep-merging', () => {
    const feature = createTestFeature({ name: 'blog' });
    const model = createTestModel({
      name: 'BlogPost',
      featureRef: feature.name,
    });
    const context = createTestEntityServiceContext({
      features: [feature],
      models: [model],
    });

    const newDef = patchEntity(
      {
        entityTypeName: 'model',
        entityId: model.id,
        entityData: {
          model: {
            fields: [
              {
                name: 'id',
                type: 'uuid',
                isOptional: false,
                options: { defaultGeneration: 'uuidv7' },
              },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      },
      context,
    );

    const newModels = newDef.models as {
      model: { fields: Record<string, unknown>[] };
    }[];
    expect(newModels[0].model.fields).toHaveLength(1);
    // Newly supplied nested entities should get IDs assigned
    expect(newModels[0].model.fields[0].id).toEqual(
      expect.stringContaining('model-scalar-field:'),
    );
  });

  it('should throw for nonexistent entity ID', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      patchEntity(
        {
          entityTypeName: 'feature',
          entityId: 'feature:nonexistent',
          entityData: { name: 'test' },
        },
        context,
      ),
    ).toThrow(/not found/);
  });

  it('should throw for unknown entity type', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      patchEntity(
        {
          entityTypeName: 'nonexistent',
          entityId: 'nonexistent:123',
          entityData: { name: 'test' },
        },
        context,
      ),
    ).toThrow('Unknown entity type: nonexistent');
  });
});

describe('deleteEntity', () => {
  it('should delete an existing entity', () => {
    const feature1 = createTestFeature({ name: 'billing' });
    const feature2 = createTestFeature({ name: 'auth' });
    const context = createTestEntityServiceContext({
      features: [feature1, feature2],
    });

    const newDef = deleteEntity(
      { entityTypeName: 'feature', entityId: feature1.id },
      context,
    );

    // Original should be unchanged
    const origFeatures = context.serializedDefinition.features as Record<
      string,
      unknown
    >[];
    expect(origFeatures).toHaveLength(2);

    // New definition should have one fewer feature
    const newFeatures = newDef.features as Record<string, unknown>[];
    expect(newFeatures).toHaveLength(1);
    expect(newFeatures[0].name).toBe('auth');
  });

  it('should delete the only entity in an array', () => {
    const feature = createTestFeature({ name: 'billing' });
    const context = createTestEntityServiceContext({ features: [feature] });

    const newDef = deleteEntity(
      { entityTypeName: 'feature', entityId: feature.id },
      context,
    );

    const newFeatures = newDef.features as unknown[];
    expect(newFeatures).toHaveLength(0);
  });

  it('should throw for nonexistent entity ID', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      deleteEntity(
        { entityTypeName: 'feature', entityId: 'feature:nonexistent' },
        context,
      ),
    ).toThrow(/not found/);
  });

  it('should throw for unknown entity type', () => {
    const context = createTestEntityServiceContext();

    expect(() =>
      deleteEntity(
        { entityTypeName: 'nonexistent', entityId: 'nonexistent:123' },
        context,
      ),
    ).toThrow('Unknown entity type: nonexistent');
  });
});
