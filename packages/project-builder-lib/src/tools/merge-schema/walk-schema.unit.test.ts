import { describe, expect, it } from 'vitest';

import { createTestProjectDefinitionContainer } from '#src/definition/project-definition-container.test-utils.js';
import { createTestFeature } from '#src/testing/definition-helpers.test-helper.js';

import { collectEntityArrays } from './walk-schema.js';

describe('collectEntityArrays', () => {
  const testFeature = createTestFeature();
  const container = createTestProjectDefinitionContainer({
    features: [testFeature],
    models: [],
  });

  it('finds top-level entity arrays in the project definition schema', () => {
    const entityArrays = collectEntityArrays(container.schema);
    const topLevelPaths = entityArrays
      .filter((info) => !info.path.includes('.'))
      .map((info) => info.path)
      .toSorted();

    // Should find at least models, apps, features, enums, libraries
    expect(topLevelPaths).toContain('models');
    expect(topLevelPaths).toContain('apps');
    expect(topLevelPaths).toContain('features');
    expect(topLevelPaths).toContain('enums');
    expect(topLevelPaths).toContain('libraries');
  });

  it('finds nested entity arrays inside models', () => {
    const entityArrays = collectEntityArrays(container.schema);
    const modelNestedPaths = entityArrays
      .filter((info) => info.path.startsWith('models.*.'))
      .map((info) => info.path)
      .toSorted();

    // Should find model fields, relations, unique constraints at minimum
    expect(modelNestedPaths).toContain('models.*.model.fields');
    expect(modelNestedPaths).toContain('models.*.model.relations');
    expect(modelNestedPaths).toContain('models.*.model.uniqueConstraints');
  });

  it('returns entity type metadata for each array', () => {
    const entityArrays = collectEntityArrays(container.schema);
    const modelsInfo = entityArrays.find((info) => info.path === 'models');

    expect(modelsInfo).toBeDefined();
    expect(modelsInfo?.entityMeta.type.name).toBe('model');
    expect(modelsInfo?.entityMeta.kind).toBe('entity');
  });

  it('returns the element schema for each array', () => {
    const entityArrays = collectEntityArrays(container.schema);
    const modelsInfo = entityArrays.find((info) => info.path === 'models');

    expect(modelsInfo?.elementSchema).toBeDefined();
  });
});
