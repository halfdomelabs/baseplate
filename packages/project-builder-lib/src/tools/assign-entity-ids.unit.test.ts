import { describe, expect, it } from 'vitest';

import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { assignEntityIds } from './assign-entity-ids.js';

describe('assignEntityIds', () => {
  const feature = createTestFeature({ name: 'core' });
  const model = createTestModel({
    name: 'User',
    featureRef: feature.name,
    model: {
      fields: [
        createTestScalarField({
          name: 'id',
          type: 'uuid',
          options: { genUuid: true },
        }),
        createTestScalarField({ name: 'email', type: 'string' }),
      ],
      primaryKeyFieldRefs: ['id'],
    },
  });
  const container = createTestProjectDefinitionContainer({
    features: [feature],
    models: [model],
  });

  const modelMetadata = container
    .toEntityServiceContext()
    .entityTypeMap.get('model');
  if (!modelMetadata) {
    throw new Error('Expected model entity type metadata');
  }

  it('replaces user-provided IDs with generated IDs', () => {
    const entityData = {
      id: 'user-provided-id',
      name: 'Post',
      featureRef: 'core',
      model: {
        fields: [
          {
            id: 'user-field-id',
            name: 'title',
            type: 'string',
            isOptional: false,
            options: { default: '' },
          },
        ],
        primaryKeyFieldRefs: ['title'],
      },
      service: {
        create: { enabled: false },
        update: { enabled: false },
        delete: { enabled: false },
        transformers: [],
      },
    };

    const result = assignEntityIds(modelMetadata.elementSchema, entityData);

    // Top-level entity ID should be replaced
    expect(result.id).not.toBe('user-provided-id');
    expect(result.id).toMatch(/^model:/);

    // Nested field ID should also be replaced
    expect(result.model.fields[0].id).not.toBe('user-field-id');
    expect(result.model.fields[0].id).toMatch(/^model-scalar-field:/);

    // Non-ID data should be preserved
    expect(result.name).toBe('Post');
    expect(result.model.fields[0].name).toBe('title');
  });

  it('preserves IDs when isExistingId returns true', () => {
    const existingModelId = model.id;
    const existingFieldId = model.model.fields[0].id;

    const entityData = {
      id: existingModelId,
      name: 'User',
      featureRef: 'core',
      model: {
        fields: [
          {
            id: existingFieldId,
            name: 'id',
            type: 'uuid',
            isOptional: false,
            options: { genUuid: true },
          },
          {
            id: 'brand-new-field',
            name: 'name',
            type: 'string',
            isOptional: false,
            options: { default: '' },
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
      service: {
        create: { enabled: false },
        update: { enabled: false },
        delete: { enabled: false },
        transformers: [],
      },
    };

    const existingIds = new Set([existingModelId, existingFieldId]);
    const result = assignEntityIds(modelMetadata.elementSchema, entityData, {
      isExistingId: (id) => existingIds.has(id),
    });

    // Existing IDs should be preserved
    expect(result.id).toBe(existingModelId);
    expect(result.model.fields[0].id).toBe(existingFieldId);

    // New field ID should be replaced
    expect(result.model.fields[1].id).not.toBe('brand-new-field');
    expect(result.model.fields[1].id).toMatch(/^model-scalar-field:/);
  });

  it('assigns IDs when entity has no ID', () => {
    const entityData = {
      name: 'Tag',
      featureRef: 'core',
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
      service: {
        create: { enabled: false },
        update: { enabled: false },
        delete: { enabled: false },
        transformers: [],
      },
    };

    const result = assignEntityIds(
      modelMetadata.elementSchema,
      entityData,
    ) as typeof entityData & {
      id: string;
      model: { fields: { id: string }[] };
    };

    expect(result.id).toMatch(/^model:/);
    expect(result.model.fields[0].id).toMatch(/^model-scalar-field:/);
  });
});
