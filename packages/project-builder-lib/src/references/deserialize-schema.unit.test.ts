import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { deserializeSchemaWithReferences } from './deserialize-schema.js';
import { zEnt, zRef, zRefId } from './ref-builder.js';
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
      ref: zRef(z.string()).addReference({
        type: entityType,
        onDelete: 'CASCADE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
      entity: [{ name: 'test-name' }],
      ref: 'test-name',
    };

    const parsedData = deserializeSchemaWithReferences(schema, dataInput);

    expect(parsedData.data.ref).toEqual(parsedData.data.entity[0].id);
  });

  it('should work with a multiple references', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(
          z.object({
            id: zRefId,
            name: z.string(),
          }),
          { type: entityType },
        ),
      ),
      nestedRef: z.object({
        ref: zRef(z.string()).addReference({
          type: entityType,
          onDelete: 'CASCADE',
        }),
      }),
      ref: zRef(z.string()).addReference({
        type: entityType,
        onDelete: 'CASCADE',
      }),
    });
    const dataInput: z.input<typeof schema> = {
      entity: [
        { name: 'test-name' },
        { name: 'test-name2' },
        { name: 'test-name3' },
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

  it.only('should work with parent references', () => {
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
              zRef(
                z.object({
                  modelName: z.string(),
                  fields: z.array(
                    zRef(z.string()).addReference({
                      type: fieldType,
                      onDelete: 'CASCADE',
                      parentPath: { context: 'foreignModel' },
                    }),
                  ),
                }),
              ).addReference({
                type: modelType,
                onDelete: 'CASCADE',
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
          name: 'todo',
          fields: [{ name: 'title' }, { name: 'id' }],
          relations: [{ modelName: 'todoList', fields: ['id'] }],
        },
        {
          name: 'todoList',
          fields: [{ name: 'title' }, { name: 'id' }],
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
