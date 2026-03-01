import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';

import { createTestProjectDefinitionContainer } from '#src/definition/project-definition-container.test-utils.js';
import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '#src/testing/definition-helpers.test-helper.js';

import { mergeDataWithSchema } from './merge-data-with-schema.js';
import { mergeDefinition } from './merge-definition.js';
import { withByKeyMergeRule, withMergeRule } from './merge-rule-registry.js';

// ---------------------------------------------------------------------------
// Pure unit tests — no project context needed
// ---------------------------------------------------------------------------

describe('mergeDataWithSchema — scalars', () => {
  it('replaces a string scalar', () => {
    const schema = z.string();
    expect(mergeDataWithSchema(schema, 'old', 'new')).toBe('new');
  });

  it('replaces a number scalar', () => {
    const schema = z.number();
    expect(mergeDataWithSchema(schema, 1, 2)).toBe(2);
  });

  it('keeps current when desired is undefined', () => {
    const schema = z.string();
    expect(mergeDataWithSchema(schema, 'current', undefined as never)).toBe(
      'current',
    );
  });
});

describe('mergeDataWithSchema — objects', () => {
  const schema = z.object({
    name: z.string(),
    value: z.number(),
    nested: z.object({ x: z.number(), y: z.number() }),
  });

  it('merges objects recursively', () => {
    const current = { name: 'old', value: 1, nested: { x: 10, y: 20 } };
    const desired = { name: 'new', value: 2, nested: { x: 99, y: 20 } };
    const result = mergeDataWithSchema(schema, current, desired);
    expect(result).toEqual({ name: 'new', value: 2, nested: { x: 99, y: 20 } });
  });

  it('preserves current fields omitted from desired (partial patch)', () => {
    const current = { name: 'old', value: 1, nested: { x: 10, y: 20 } };
    // Desired omits `value` and `nested`
    const desired = { name: 'new' };
    const result = mergeDataWithSchema(schema, current, desired);
    expect(result).toEqual({ name: 'new', value: 1, nested: { x: 10, y: 20 } });
  });

  it('does not mutate current', () => {
    const current = { name: 'old', value: 1, nested: { x: 10, y: 20 } };
    const desired = { name: 'new', value: 2, nested: { x: 99, y: 20 } };
    mergeDataWithSchema(schema, current, desired);
    expect(current.name).toBe('old');
  });
});

describe('mergeDataWithSchema — arrays (default full replace)', () => {
  it('replaces string arrays entirely', () => {
    const schema = z.array(z.string());
    const result = mergeDataWithSchema(schema, ['a', 'b', 'c'], ['x', 'y']);
    expect(result).toEqual(['x', 'y']);
  });
});

describe('mergeDataWithSchema — withMergeRule replace', () => {
  const schema = z.object({
    name: z.string(),
    config: z
      .object({ a: z.string(), b: z.number() })
      .apply(withMergeRule({ kind: 'replace' })),
  });

  it('replaces entire object when rule is replace', () => {
    const current = { name: 'test', config: { a: 'old', b: 1 } };
    const desired = { name: 'test', config: { a: 'new', b: 99 } };
    const result = mergeDataWithSchema(
      schema,
      current,
      desired,
    ) as typeof current;
    expect(result.config).toEqual({ a: 'new', b: 99 });
  });

  it('keeps current config when desired config is undefined', () => {
    const current = { name: 'test', config: { a: 'old', b: 1 } };
    const desired = { name: 'new' };
    const result = mergeDataWithSchema(schema, current, desired);
    expect(result.config).toEqual({ a: 'old', b: 1 });
  });
});

describe('mergeDataWithSchema — withByKeyMergeRule', () => {
  const schema = z
    .array(z.object({ key: z.string(), value: z.number() }))
    .apply(
      withByKeyMergeRule({
        getKey: (item: { key: string }) => item.key,
      }),
    );

  it('adds new items by key', () => {
    const current = [{ key: 'a', value: 1 }];
    const desired = [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
    ];
    const result = mergeDataWithSchema(
      schema,
      current,
      desired,
    ) as typeof current;
    expect(result).toHaveLength(2);
    expect(result.find((i) => i.key === 'b')?.value).toBe(2);
  });

  it('updates existing items by key', () => {
    const current = [{ key: 'a', value: 1 }];
    const desired = [{ key: 'a', value: 99 }];
    const result = mergeDataWithSchema(
      schema,
      current,
      desired,
    ) as typeof current;
    expect(result[0].value).toBe(99);
  });

  it('keeps items not in desired (add-only semantics)', () => {
    const current = [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
    ];
    const desired = [{ key: 'a', value: 99 }];
    const result = mergeDataWithSchema(
      schema,
      current,
      desired,
    ) as typeof current;
    expect(result).toHaveLength(2);
    expect(result.find((i) => i.key === 'a')?.value).toBe(99);
    expect(result.find((i) => i.key === 'b')?.value).toBe(2);
  });
});

describe('mergeDataWithSchema — discriminated union', () => {
  const schema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('a'), x: z.number(), y: z.string() }),
    z.object({ type: z.literal('b'), p: z.boolean(), q: z.string() }),
  ]);

  it('merges into the matching discriminated union branch', () => {
    const current = { type: 'a' as const, x: 1, y: 'old' };
    const desired = { type: 'a' as const, x: 99 };
    const result = mergeDataWithSchema(schema, current, desired);
    expect(result.type).toBe('a');
    expect((result as typeof current).x).toBe(99);
    expect((result as typeof current).y).toBe('old'); // Preserved from current
  });

  it('replaces entirely when discriminator changes', () => {
    const current = { type: 'a' as const, x: 1, y: 'old' };
    const desired = { type: 'b' as const, p: true, q: 'new' };
    const result = mergeDataWithSchema(schema, current, desired);
    expect(result.type).toBe('b');
  });
});

describe('mergeDataWithSchema — wrapper schemas', () => {
  it('descends through optional wrapper', () => {
    const schema = z.string().optional();
    expect(mergeDataWithSchema(schema, 'old', 'new')).toBe('new');
    expect(mergeDataWithSchema(schema, 'old', undefined)).toBe('old');
  });

  it('descends through default wrapper', () => {
    const schema = z.string().default('default');
    expect(mergeDataWithSchema(schema, 'old', 'new')).toBe('new');
  });
});

// ---------------------------------------------------------------------------
// Integration tests — real model schema with serialize/deserialize
// Works at the full project definition level so cross-entity refs (featureRef)
// can be resolved during deserialization.
// ---------------------------------------------------------------------------

/**
 * Merge `desiredModels` into the current project definition.
 * Returns the full new ProjectDefinitionContainer after round-trip.
 */
function mergeDefinitionModels(
  container: ProjectDefinitionContainer,
  desiredModels: Record<string, unknown>[],
): ProjectDefinitionContainer {
  return mergeDefinition(container, { models: desiredModels });
}

describe('mergeDataWithSchema — model schema integration', () => {
  const testFeature = createTestFeature();

  it('adds a field to an existing model', () => {
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

    const desired = [
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
    ];

    const result = mergeDefinitionModels(container, desired);
    const userModel = result.definition.models.find((m) => m.name === 'User');

    expect(userModel?.model.fields).toHaveLength(2);
    expect(
      userModel?.model.fields.find((f) => f.name === 'email'),
    ).toBeDefined();
    // Existing field preserves its ID
    expect(userModel?.model.fields.find((f) => f.name === 'id')?.id).toBe(
      idField.id,
    );
    // New field gets an assigned ID
    expect(
      userModel?.model.fields.find((f) => f.name === 'email')?.id,
    ).toBeTruthy();
    // featureRef is resolved back to ID
    expect(userModel?.featureRef).toBe(testFeature.id);
    // Model preserves its ID
    expect(userModel?.id).toBe(currentModel.id);
  });

  it('removes a field not in desired list', () => {
    const idField = createTestScalarField({
      name: 'id',
      type: 'uuid',
      options: { genUuid: true },
    });
    const emailField = createTestScalarField({ name: 'email', type: 'string' });
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

    const desired = [
      {
        name: 'User',
        featureRef: testFeature.name,
        model: {
          // Only id — email is absent, so should be removed
          fields: [{ name: 'id', type: 'uuid', options: { genUuid: true } }],
          primaryKeyFieldRefs: ['id'],
        },
      },
    ];

    const result = mergeDefinitionModels(container, desired);
    const userModel = result.definition.models.find((m) => m.name === 'User');

    expect(userModel?.model.fields).toHaveLength(1);
    expect(userModel?.model.fields[0].name).toBe('id');
  });

  it('updates an existing field', () => {
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

    const desired = [
      {
        name: 'User',
        featureRef: testFeature.name,
        model: {
          fields: [
            { name: 'id', type: 'uuid', options: { genUuid: true } },
            { name: 'email', type: 'string', isOptional: true }, // Changed
          ],
          primaryKeyFieldRefs: ['id'],
        },
      },
    ];

    const result = mergeDefinitionModels(container, desired);
    const userModel = result.definition.models.find((m) => m.name === 'User');
    const emailResult = userModel?.model.fields.find((f) => f.name === 'email');

    expect(emailResult?.isOptional).toBe(true);
    // Field ID is preserved
    expect(emailResult?.id).toBe(emailField.id);
  });

  it('adds a new model without affecting existing ones', () => {
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

    const desired = [
      // Existing model unchanged
      {
        name: 'User',
        featureRef: testFeature.name,
        model: {
          fields: [{ name: 'id', type: 'uuid', options: { genUuid: true } }],
          primaryKeyFieldRefs: ['id'],
        },
      },
      // New model
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
    ];

    const result = mergeDefinitionModels(container, desired);

    expect(result.definition.models).toHaveLength(2);
    const postModel = result.definition.models.find((m) => m.name === 'Post');
    expect(postModel?.model.fields).toHaveLength(2);
    expect(postModel?.model.fields[0].id).toBeTruthy();
    // Existing model preserved
    const userModel = result.definition.models.find((m) => m.name === 'User');
    expect(userModel?.id).toBe(currentModel.id);
  });
});
