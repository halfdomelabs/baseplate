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

    const issues = checkRelationTypeMismatch(container.definition, {
      pluginStore: container.pluginStore,
    });
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

    const issues = checkRelationTypeMismatch(container.definition, {
      pluginStore: container.pluginStore,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message:
        "Relation 'user' type mismatch: 'userId' is 'int' but 'id' on 'User' is 'uuid'",
      path: ['models', 1, 'model', 'relations', 0, 'references', 0],
      severity: 'warning',
    });
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

    const issues = checkRelationTypeMismatch(container.definition, {
      pluginStore: container.pluginStore,
    });
    expect(issues).toEqual([]);
  });

  it('handles empty models array', () => {
    const container = createTestProjectDefinitionContainer();

    const issues = checkRelationTypeMismatch(container.definition, {
      pluginStore: container.pluginStore,
    });
    expect(issues).toEqual([]);
  });
});
