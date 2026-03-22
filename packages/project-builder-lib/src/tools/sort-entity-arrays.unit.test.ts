import { describe, expect, it } from 'vitest';

import { serializeSchema } from '#src/references/serialize-schema.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';
import { createTestProjectDefinitionContainer } from '#src/testing/project-definition-container.test-helper.js';

import { sortEntityArrays } from './sort-entity-arrays.js';

describe('sortEntityArrays', () => {
  const testFeature = createTestFeature({ name: 'testfeature' });

  it('sorts entity arrays with sortByName: true', () => {
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [
        createTestModel({
          name: 'Zebra',
          featureRef: testFeature.name,
        }),
        createTestModel({
          name: 'Apple',
          featureRef: testFeature.name,
        }),
        createTestModel({
          name: 'Mango',
          featureRef: testFeature.name,
        }),
      ],
    });

    const serialized = serializeSchema(
      container.schema,
      container.definition,
    ) as Record<string, unknown>;
    const sorted = sortEntityArrays(container.schema, serialized);

    const modelNames = (sorted.models as { name: string }[]).map((m) => m.name);
    expect(modelNames).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('preserves order of entity arrays without sortByName', () => {
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [
        createTestModel({
          name: 'MyModel',
          featureRef: testFeature.name,
          model: {
            fields: [
              createTestScalarField({ name: 'id', type: 'uuid' }),
              createTestScalarField({ name: 'zebra', type: 'string' }),
              createTestScalarField({ name: 'alpha', type: 'string' }),
            ],
            primaryKeyFieldRefs: ['id'],
          },
        }),
      ],
    });

    const serialized = serializeSchema(
      container.schema,
      container.definition,
    ) as Record<string, unknown>;
    const sorted = sortEntityArrays(container.schema, serialized);

    const model = (
      sorted.models as { model: { fields: { name: string }[] } }[]
    )[0];
    const fieldNames = model.model.fields.map((f) => f.name);
    // Fields don't have sortByName, so they keep original order
    expect(fieldNames).toEqual(['id', 'zebra', 'alpha']);
  });

  it('does not mutate the original data', () => {
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [
        createTestModel({
          name: 'Zebra',
          featureRef: testFeature.name,
        }),
        createTestModel({
          name: 'Apple',
          featureRef: testFeature.name,
        }),
      ],
    });

    const serialized = serializeSchema(
      container.schema,
      container.definition,
    ) as Record<string, unknown>;

    const originalModelNames = (serialized.models as { name: string }[]).map(
      (m) => m.name,
    );

    sortEntityArrays(container.schema, serialized);

    const afterModelNames = (serialized.models as { name: string }[]).map(
      (m) => m.name,
    );
    expect(afterModelNames).toEqual(originalModelNames);
  });

  it('handles empty entity arrays', () => {
    const container = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: [],
    });

    const serialized = serializeSchema(
      container.schema,
      container.definition,
    ) as Record<string, unknown>;
    const sorted = sortEntityArrays(container.schema, serialized);

    expect(sorted.models).toEqual([]);
  });

  it('produces deterministic output regardless of insertion order', () => {
    const modelsABC = [
      createTestModel({ name: 'Alpha', featureRef: testFeature.name }),
      createTestModel({ name: 'Bravo', featureRef: testFeature.name }),
      createTestModel({ name: 'Charlie', featureRef: testFeature.name }),
    ];
    const modelsCBA = [modelsABC[2], modelsABC[1], modelsABC[0]];

    const container1 = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: modelsABC,
    });
    const container2 = createTestProjectDefinitionContainer({
      features: [testFeature],
      models: modelsCBA,
    });

    const result1 = container1.toSerializedContents();
    const result2 = container2.toSerializedContents();

    expect(result1).toBe(result2);
  });
});
