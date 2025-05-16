import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { zEnt, zRefBuilder, zRefId } from './ref-builder.js';
import { serializeSchema } from './serialize-schema.js';
import { createEntityType } from './types.js';

describe('serializeSchema', () => {
  it('should work with a no-reference object', () => {
    const schema = z.object({
      test: z.string(),
    });

    const refPayload = serializeSchema(schema, {
      test: 'hi',
    });

    expect(refPayload).toMatchObject({
      test: 'hi',
    });
  });

  it('should work with a simple reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ name: z.string() }), {
          type: entityType,
        }),
      ),
      ref: zRefBuilder(z.string()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
    });
    const data: z.TypeOf<typeof schema> = {
      entity: [{ id: entityType.fromUid('test-id'), name: 'test-name' }],
      ref: entityType.fromUid('test-id'),
    };

    const refPayload = serializeSchema(schema, data);

    expect(refPayload).toMatchObject({
      entity: [{ id: entityType.fromUid('test-id'), name: 'test-name' }],
      ref: 'test-name',
    });
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
        ref: zRefBuilder(z.string()).addReference({
          type: entityType,
          onDelete: 'RESTRICT',
        }),
      }),
      ref: zRefBuilder(z.string()).addReference({
        type: entityType,
        onDelete: 'RESTRICT',
      }),
    });

    const data: z.TypeOf<typeof schema> = {
      entity: [
        { id: entityType.fromUid('test-id1'), name: 'test-name' },
        { id: entityType.fromUid('test-id2'), name: 'test-name2' },
        { id: entityType.fromUid('test-id3'), name: 'test-name3' },
      ],
      nestedRef: {
        ref: entityType.fromUid('test-id2'),
      },
      ref: entityType.fromUid('test-id3'),
    };
    const refPayload = serializeSchema(schema, data);

    expect(refPayload).toMatchObject({
      entity: [
        { id: entityType.fromUid('test-id1'), name: 'test-name' },
        { id: entityType.fromUid('test-id2'), name: 'test-name2' },
        { id: entityType.fromUid('test-id3'), name: 'test-name3' },
      ],
      nestedRef: {
        ref: 'test-name2',
      },
      ref: 'test-name3',
    });
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
                      onDelete: 'RESTRICT',
                      parentPath: { context: 'foreignModel' },
                    }),
                  ),
                }),
              ).addReference({
                type: modelType,
                onDelete: 'RESTRICT',
                addContext: 'foreignModel',
                path: 'modelName',
              }),
            ),
          }),
          { type: modelType, addContext: 'model' },
        ),
      ),
    });
    const data: z.TypeOf<typeof schema> = {
      models: [
        {
          id: modelType.fromUid('model-todo'),
          name: 'todo',
          fields: [
            { id: fieldType.fromUid('todo-title'), name: 'title' },
            { id: fieldType.fromUid('todo-id'), name: 'id' },
          ],
          relations: [
            {
              modelName: modelType.fromUid('model-todoList'),
              fields: [fieldType.fromUid('todoList-id')],
            },
          ],
        },
        {
          id: modelType.fromUid('model-todoList'),
          name: 'todoList',
          fields: [
            { id: fieldType.fromUid('todoList-title'), name: 'title' },
            { id: fieldType.fromUid('todoList-id'), name: 'id' },
          ],
          relations: [],
        },
      ],
    };
    const refPayload = serializeSchema(schema, data);

    expect(refPayload).toMatchObject({
      models: [
        {
          id: modelType.fromUid('model-todo'),
          name: 'todo',
          fields: [
            { id: fieldType.fromUid('todo-title'), name: 'title' },
            { id: fieldType.fromUid('todo-id'), name: 'id' },
          ],
          relations: [{ modelName: 'todoList', fields: ['id'] }],
        },
        {
          id: modelType.fromUid('model-todoList'),
          name: 'todoList',
          fields: [
            { id: fieldType.fromUid('todoList-title'), name: 'title' },
            { id: fieldType.fromUid('todoList-id'), name: 'id' },
          ],
          relations: [],
        },
      ],
    });
  });
});
