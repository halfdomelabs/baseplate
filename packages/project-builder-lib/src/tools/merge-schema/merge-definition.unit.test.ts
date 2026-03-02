import { describe, expect, it } from 'vitest';

import { createTestProjectDefinitionContainer } from '#src/definition/project-definition-container.test-utils.js';
import { serializeSchema } from '#src/references/serialize-schema.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';

import { mergeDefinitionContainer } from './merge-definition.js';

describe('mergeDefinitionContainer', () => {
  const testFeature = createTestFeature();

  it('adds a new model to the definition', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const currentModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: { fields: [idField], primaryKeyFieldRefs: [idField.name] },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [currentModel],
    });

    const result = mergeDefinitionContainer(container, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [{ name: 'id', type: 'uuid', options: { genUuid: true } }],
            primaryKeyFieldRefs: ['id'],
          },
        },
        {
          name: 'Post',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'title', type: 'string' },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    expect(result.definition.models).toHaveLength(2);
    const postModel = result.definition.models.find((m) => m.name === 'Post');
    expect(postModel).toBeDefined();
    expect(postModel?.model.fields).toHaveLength(2);
    // New model gets a fresh ID
    expect(postModel?.id).toBeTruthy();
  });

  it('updates fields on an existing model', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const emailField = createTestScalarField({
      name: 'email',
      type: 'string',
      isOptional: false,
    });
    const currentModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: {
        fields: [idField, emailField],
        primaryKeyFieldRefs: [idField.name],
      },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [currentModel],
    });

    const result = mergeDefinitionContainer(container, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'email', type: 'string', isOptional: true },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    const userModel = result.definition.models.find((m) => m.name === 'User');
    const emailResult = userModel?.model.fields.find((f) => f.name === 'email');
    expect(emailResult?.isOptional).toBe(true);
    // Field ID is preserved
    expect(emailResult?.id).toBe(emailField.id);
  });

  it('preserves non-mentioned top-level fields', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const currentModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: { fields: [idField], primaryKeyFieldRefs: [idField.name] },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [currentModel],
    });

    // Merge with only models — features, settings, etc. should be preserved
    const result = mergeDefinitionContainer(container, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [{ name: 'id', type: 'uuid', options: { genUuid: true } }],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    // Features should still be there
    expect(result.definition.features).toHaveLength(1);
    expect(result.definition.features[0].name).toBe(testFeature.name);
    // Settings should be preserved
    expect(result.definition.settings.general.name).toBe('test-project');
  });

  it('preserves existing models not in the desired models list', () => {
    const idField1 = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const idField2 = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const userModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: { fields: [idField1], primaryKeyFieldRefs: [idField1.name] },
    });
    const postModel = createTestModel({
      name: 'Post',
      featureRef: testFeature.name,
      model: { fields: [idField2], primaryKeyFieldRefs: [idField2.name] },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [userModel, postModel],
    });

    // Serialize to get the current state including both models
    const serialized = serializeSchema(container.schema, container.definition);

    // Merge with only one model in patch input; the other should still be preserved
    const result = mergeDefinitionContainer(container, {
      models: serialized.models.filter((m) => m.name === 'User'),
    });

    expect(result.definition.models).toHaveLength(2);
    expect(
      result.definition.models.find((m) => m.name === 'User'),
    ).toBeDefined();
    expect(
      result.definition.models.find((m) => m.name === 'Post'),
    ).toBeDefined();
    // IDs are preserved
    expect(result.definition.models.find((m) => m.name === 'User')?.id).toBe(
      userModel.id,
    );
    expect(result.definition.models.find((m) => m.name === 'Post')?.id).toBe(
      postModel.id,
    );
  });

  it('returns a valid ProjectDefinitionContainer', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const currentModel = createTestModel({
      name: 'User',
      featureRef: testFeature.name,
      model: { fields: [idField], primaryKeyFieldRefs: [idField.name] },
    });
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [currentModel],
    });

    const result = mergeDefinitionContainer(container, {
      models: [
        {
          name: 'User',
          featureRef: testFeature.name,
          model: {
            fields: [
              { name: 'id', type: 'uuid', options: { genUuid: true } },
              { name: 'email', type: 'string' },
            ],
            primaryKeyFieldRefs: ['id'],
          },
        },
      ],
    });

    // Should have entities populated
    expect(result.entities.length).toBeGreaterThan(0);
    // Should have references populated
    expect(result.references.length).toBeGreaterThan(0);
    // Should be able to look up entities by ID
    const userModel = result.definition.models.find((m) => m.name === 'User');
    expect(result.entityFromId(userModel?.id)).toBeDefined();
  });
});
