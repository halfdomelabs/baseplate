import { describe, expect, it } from 'vitest';

import type { createTestProjectDefinitionInput } from '#src/definition/project-definition-container.test-utils.js';

import { createTestProjectDefinitionContainer } from '#src/definition/project-definition-container.test-utils.js';
import {
  createTestFeature,
  createTestModel,
} from '#src/testing/definition-helpers.test-helper.js';

import type { EntityServiceContext } from './types.js';

import { listEntities } from './entity-read.js';
import { createEntity, deleteEntity, updateEntity } from './entity-write.js';

function createTestContext(
  input: Parameters<typeof createTestProjectDefinitionInput>[0] = {},
): EntityServiceContext {
  return createTestProjectDefinitionContainer(input).toEntityServiceContext();
}

describe('createEntity', () => {
  it('should create a top-level entity and return a new definition', () => {
    const context = createTestContext();

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
    const context = createTestContext({
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
    const context = createTestContext();

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
    const context = createTestContext({ features: [feature] });

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
    const context = createTestContext();

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
    const context = createTestContext();

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

describe('deleteEntity', () => {
  it('should delete an existing entity', () => {
    const feature1 = createTestFeature({ name: 'billing' });
    const feature2 = createTestFeature({ name: 'auth' });
    const context = createTestContext({
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
    const context = createTestContext({ features: [feature] });

    const newDef = deleteEntity(
      { entityTypeName: 'feature', entityId: feature.id },
      context,
    );

    const newFeatures = newDef.features as unknown[];
    expect(newFeatures).toHaveLength(0);
  });

  it('should throw for nonexistent entity ID', () => {
    const context = createTestContext();

    expect(() =>
      deleteEntity(
        { entityTypeName: 'feature', entityId: 'feature:nonexistent' },
        context,
      ),
    ).toThrow(/not found/);
  });

  it('should throw for unknown entity type', () => {
    const context = createTestContext();

    expect(() =>
      deleteEntity(
        { entityTypeName: 'nonexistent', entityId: 'nonexistent:123' },
        context,
      ),
    ).toThrow('Unknown entity type: nonexistent');
  });
});
