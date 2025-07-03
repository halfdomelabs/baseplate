import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginImplementationStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { deserializeSchemaWithTransformedReferences } from './deserialize-schema.js';
import { createEntityType } from './types.js';

describe('deserializeSchemaWithTransformedReferences', () => {
  const pluginStore = new PluginImplementationStore({});

  it('should work with a no-reference object', () => {
    const schemaCreator = definitionSchema((_ctx) =>
      z.object({
        test: z.string(),
      }),
    );

    const refPayload = deserializeSchemaWithTransformedReferences(
      schemaCreator,
      { test: 'hi' },
      { plugins: pluginStore },
    );

    expect(refPayload).toMatchObject({
      data: { test: 'hi' },
      references: [],
      entities: [],
    });
  });

  it('should work with a simple reference', () => {
    const entityType = createEntityType('entity');

    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        ref: ctx.withRef(z.string(), {
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
    );

    const dataInput = {
      entity: [{ id: entityType.generateNewId(), name: 'test-name' }],
      ref: 'test-name',
    };

    const parsedData = deserializeSchemaWithTransformedReferences(
      schemaCreator,
      dataInput,
      { plugins: pluginStore },
    );

    expect(parsedData.data.ref).toEqual(parsedData.data.entity[0].id);
  });

  it('should work with optional references', () => {
    const entityType = createEntityType('entity');

    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        nullRef: ctx.withRef(z.string().nullable(), {
          type: entityType,
          onDelete: 'DELETE',
        }),
        undefinedRef: ctx.withRef(z.string().optional(), {
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
    );

    const dataInput = {
      entity: [{ id: entityType.generateNewId(), name: 'test-name' }],
      nullRef: null,
      undefinedRef: undefined,
    };

    const parsedData = deserializeSchemaWithTransformedReferences(
      schemaCreator,
      dataInput,
      { plugins: pluginStore },
    );

    expect(parsedData.data.nullRef).toBeNull();
    expect(parsedData.data.undefinedRef).toBeUndefined();
  });

  it('should fail with an optional reference that is an empty string', () => {
    const entityType = createEntityType('entity');

    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        ref: ctx.withRef(z.string(), {
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
    );

    const dataInput = {
      entity: [{ id: entityType.idFromKey('test-id'), name: 'test-name' }],
      ref: 'non-existent-name',
    };

    expect(() =>
      deserializeSchemaWithTransformedReferences(schemaCreator, dataInput, {
        plugins: pluginStore,
      }),
    ).toThrow('Unable to resolve reference');
  });

  it('should work with multiple references', () => {
    const entityType = createEntityType('entity');

    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        nestedRef: z.object({
          ref: ctx.withRef(z.string(), {
            type: entityType,
            onDelete: 'DELETE',
          }),
        }),
        ref: ctx.withRef(z.string(), {
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
    );

    const dataInput = {
      entity: [
        { id: entityType.generateNewId(), name: 'test-name' },
        { id: entityType.generateNewId(), name: 'test-name2' },
        { id: entityType.generateNewId(), name: 'test-name3' },
      ],
      nestedRef: {
        ref: 'test-name2',
      },
      ref: 'test-name3',
    };

    const parsedData = deserializeSchemaWithTransformedReferences(
      schemaCreator,
      dataInput,
      { plugins: pluginStore },
    );

    expect(parsedData.data.ref).toEqual(parsedData.data.entity[2].id);
    expect(parsedData.data.nestedRef.ref).toEqual(parsedData.data.entity[1].id);
  });

  it('should work with withRefBuilder for complex scenarios', () => {
    const entityType = createEntityType('entity');

    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entities: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        complexRef: ctx.withRefBuilder(
          z.object({
            targetName: z.string(),
            metadata: z.object({
              description: z.string(),
            }),
          }),
          (builder, _data) => {
            builder.addReference({
              type: entityType,
              onDelete: 'DELETE',
              path: 'targetName',
            });
          },
        ),
      }),
    );

    const dataInput = {
      entities: [{ id: entityType.generateNewId(), name: 'target-entity' }],
      complexRef: {
        targetName: 'target-entity',
        metadata: {
          description: 'This is a complex reference',
        },
      },
    };

    const parsedData = deserializeSchemaWithTransformedReferences(
      schemaCreator,
      dataInput,
      { plugins: pluginStore },
    );

    expect(parsedData.data.complexRef.targetName).toEqual(
      parsedData.data.entities[0].id,
    );
    expect(parsedData.data.complexRef.metadata.description).toEqual(
      'This is a complex reference',
    );
  });
});
