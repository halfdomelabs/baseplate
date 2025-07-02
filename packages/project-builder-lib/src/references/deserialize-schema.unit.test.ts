import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginImplementationStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import {
  deserializeSchemaWithReferences,
  deserializeSchemaWithTransformedReferences,
} from './deserialize-schema.js';
import { zEnt, zRefBuilder, zRefId } from './ref-builder.js';
import { createEntityType } from './types.js';

describe('deserializeSchemaWithReferences', () => {
  it('should work with a no-reference object', () => {
    const schema = z.object({
      test: z.string(),
    });

    const refPayload = deserializeSchemaWithReferences(schema, {
      test: 'hi',
    });

    expect(refPayload).toMatchObject({
      data: { test: 'hi' },
      references: [],
      entities: [],
    });
  });

  it('should work with a simple reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ id: zRefId, name: z.string() }), {
          type: entityType,
        }),
      ),
      ref: zRefBuilder(z.string()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
      entity: [{ id: entityType.generateNewId(), name: 'test-name' }],
      ref: 'test-name',
    };

    const parsedData = deserializeSchemaWithReferences(schema, dataInput);

    expect(parsedData.data.ref).toEqual(parsedData.data.entity[0].id);
  });

  it('should work with an optional reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ id: zRefId, name: z.string() }), {
          type: entityType,
        }),
      ),
      nullRef: zRefBuilder(z.string().nullable()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
      undefinedRef: zRefBuilder(z.string().optional()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
      entity: [{ id: entityType.generateNewId(), name: 'test-name' }],
      nullRef: null,
      undefinedRef: undefined,
    };

    const parsedData = deserializeSchemaWithReferences(schema, dataInput);

    expect(parsedData.data.nullRef).toBeNull();
    expect(parsedData.data.undefinedRef).toBeUndefined();
  });

  it('should fail with an optional reference that is an empty string', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ id: zRefId, name: z.string() }), {
          type: entityType,
        }),
      ),
      ref: zRefBuilder(z.string().nullish()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
      entity: [{ id: entityType.idFromKey('test-id'), name: 'test-name' }],
      ref: '',
    };

    expect(() =>
      deserializeSchemaWithReferences(schema, dataInput),
    ).toThrowError('Unable to resolve reference');
  });

  it('should work with a multiple references', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(
          z.object({
            name: z.string(),
          }),
          { type: entityType },
        ),
      ),
      nestedRef: z.object({
        ref: zRefBuilder(z.string()).addReference({
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
      ref: zRefBuilder(z.string()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
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

    const parsedData = deserializeSchemaWithReferences(schema, dataInput);

    expect(parsedData.data.ref).toEqual(parsedData.data.entity[2].id);
    expect(parsedData.data.nestedRef.ref).toEqual(parsedData.data.entity[1].id);
  });

  it('should work with parent references', () => {
    const modelType = createEntityType('model');
    const fieldType = createEntityType('field', {
      parentType: modelType,
    });
    const schema = z.object({
      models: z.array(
        zEnt(
          z.object({
            name: z.string(),
            fields: z.array(
              zEnt(
                z.object({
                  name: z.string(),
                }),
                { type: fieldType, parentPath: { context: 'model' } },
              ),
            ),
            relations: z.array(
              zRefBuilder(
                z.object({
                  modelName: z.string(),
                  fields: z.array(
                    zRefBuilder(z.string()).addReference({
                      type: fieldType,
                      onDelete: 'DELETE',
                      parentPath: { context: 'foreignModel' },
                    }),
                  ),
                }),
              ).addReference({
                type: modelType,
                onDelete: 'DELETE',
                addContext: 'foreignModel',
                path: 'modelName',
              }),
            ),
          }),
          { type: modelType, addContext: 'model' },
        ),
      ),
    });
    const dataInput: z.input<typeof schema> = {
      models: [
        {
          id: modelType.generateNewId(),
          name: 'todo',
          fields: [
            { id: fieldType.generateNewId(), name: 'title' },
            { id: fieldType.generateNewId(), name: 'id' },
          ],
          relations: [{ modelName: 'todoList', fields: ['id'] }],
        },
        {
          id: modelType.generateNewId(),
          name: 'todoList',
          fields: [
            { id: fieldType.generateNewId(), name: 'title' },
            { id: fieldType.generateNewId(), name: 'id' },
          ],
          relations: [],
        },
      ],
    };

    const parsedData = deserializeSchemaWithReferences(schema, dataInput);

    expect(parsedData.data.models[0].relations[0].fields[0]).toEqual(
      parsedData.data.models[1].fields[1].id,
    );
  });
});

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
          ctx.withEnt(z.object({ name: z.string() }), {
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
          ctx.withEnt(z.object({ name: z.string() }), {
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
          ctx.withEnt(z.object({ name: z.string() }), {
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
          ctx.withEnt(z.object({ name: z.string() }), {
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
          ctx.withEnt(z.object({ name: z.string() }), {
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

  describe('backward compatibility', () => {
    it('should produce equivalent results to old system for simple cases', () => {
      const entityType = createEntityType('entity');

      // Old system
      const oldSchema = z.object({
        entity: z.array(
          zEnt(z.object({ id: zRefId, name: z.string() }), {
            type: entityType,
          }),
        ),
        ref: zRefBuilder(z.string()).addReference({
          type: entityType,
          onDelete: 'DELETE',
        }),
      });

      // New system
      const newSchemaCreator = definitionSchema((ctx) =>
        z.object({
          entity: z.array(
            ctx.withEnt(z.object({ name: z.string() }), {
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

      const oldResult = deserializeSchemaWithReferences(oldSchema, dataInput);
      const newResult = deserializeSchemaWithTransformedReferences(
        newSchemaCreator,
        dataInput,
        { plugins: pluginStore },
      );

      expect(oldResult.data).toEqual(newResult.data);
      expect(oldResult.references).toEqual(newResult.references);
      expect(oldResult.entities).toEqual(newResult.entities);
    });
  });
});
