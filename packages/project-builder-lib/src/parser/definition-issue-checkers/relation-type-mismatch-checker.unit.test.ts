import { produce } from 'immer';
import { describe, expect, it } from 'vitest';

import {
  createTestFeature,
  createTestModel,
  createTestRelationField,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { checkRelationTypeMismatch } from './relation-type-mismatch-checker.js';

describe('checkRelationTypeMismatch', () => {
  const feature = createTestFeature({ name: 'core' });

  it('returns no issues when relation types match', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
      models: [
        createTestModel({
          name: 'User',
          featureRef: feature.name,
          model: {
            fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
            primaryKeyFieldRefs: ['id'],
          },
        }),
        createTestModel({
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
                references: [{ localRef: 'userId', foreignRef: 'id' }],
              }),
            ],
          },
        }),
      ],
    });

    const issues = checkRelationTypeMismatch(container);
    expect(issues).toEqual([]);
  });

  it('returns warning when relation types mismatch', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
      models: [
        createTestModel({
          name: 'User',
          featureRef: feature.name,
          model: {
            fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
            primaryKeyFieldRefs: ['id'],
          },
        }),
        createTestModel({
          name: 'Post',
          featureRef: feature.name,
          model: {
            fields: [
              createTestScalarField({ name: 'id', type: 'uuid' }),
              createTestScalarField({ name: 'userId', type: 'int' }),
            ],
            primaryKeyFieldRefs: ['id'],
            relations: [
              createTestRelationField({
                name: 'user',
                modelRef: 'User',
                references: [{ localRef: 'userId', foreignRef: 'id' }],
              }),
            ],
          },
        }),
      ],
    });

    const issues = checkRelationTypeMismatch(container);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      message:
        "Relation 'user' type mismatch: 'userId' is 'int' but 'id' on 'User' is 'uuid'",
      entityId: container.definition.models[1].id,
      path: ['model', 'relations', 0],
      severity: 'warning',
    });
    expect(issues[0].fix).toBeDefined();
    expect(issues[0].fix?.label).toBe("Change 'userId' type to 'uuid'");
  });

  it('fix changes local field type to match foreign field type', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
      models: [
        createTestModel({
          name: 'User',
          featureRef: feature.name,
          model: {
            fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
            primaryKeyFieldRefs: ['id'],
          },
        }),
        createTestModel({
          name: 'Post',
          featureRef: feature.name,
          model: {
            fields: [
              createTestScalarField({ name: 'id', type: 'uuid' }),
              createTestScalarField({ name: 'userId', type: 'int' }),
            ],
            primaryKeyFieldRefs: ['id'],
            relations: [
              createTestRelationField({
                name: 'user',
                modelRef: 'User',
                references: [{ localRef: 'userId', foreignRef: 'id' }],
              }),
            ],
          },
        }),
      ],
    });

    const issues = checkRelationTypeMismatch(container);
    expect(issues).toHaveLength(1);

    const { fix } = issues[0];
    if (!fix?.applySetter) {
      throw new Error('Expected fix.applySetter to be defined');
    }

    // Apply the fix using Immer produce
    const fixedDefinition = produce(container.definition, fix.applySetter);

    // The local field should now have the foreign field's type
    const postModel = fixedDefinition.models.find((m) => m.name === 'Post');
    const userIdField = postModel?.model.fields.find(
      (f) => f.name === 'userId',
    );
    expect(userIdField?.type).toBe('uuid');
  });

  it('handles models with no relations', () => {
    const container = createTestProjectDefinitionContainer({
      features: [feature],
      models: [
        createTestModel({
          name: 'User',
          featureRef: feature.name,
          model: {
            fields: [createTestScalarField({ name: 'id', type: 'uuid' })],
            primaryKeyFieldRefs: ['id'],
          },
        }),
      ],
    });

    const issues = checkRelationTypeMismatch(container);
    expect(issues).toEqual([]);
  });

  it('handles empty models array', () => {
    const container = createTestProjectDefinitionContainer();

    const issues = checkRelationTypeMismatch(container);
    expect(issues).toEqual([]);
  });
});
