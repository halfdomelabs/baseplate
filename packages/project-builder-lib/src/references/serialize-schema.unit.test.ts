import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginImplementationStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { createRefContextSlot } from './ref-context-slot.js';
import { serializeSchema } from './serialize-schema.js';
import { createEntityType } from './types.js';

describe('serializeSchema', () => {
  const pluginStore = new PluginImplementationStore({});
  it('should work with a no-reference object', () => {
    const schemaCreator = definitionSchema(() =>
      z.object({
        test: z.string(),
      }),
    );

    const refPayload = serializeSchema(
      schemaCreator,
      { test: 'hi' },
      {
        plugins: pluginStore,
      },
    );

    expect(refPayload).toMatchObject({
      test: 'hi',
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
        ref: ctx.withRef({
          type: entityType,
          onDelete: 'DELETE',
        }),
      }),
    );

    const data = {
      entity: [{ id: entityType.idFromKey('test-id'), name: 'test-name' }],
      ref: entityType.idFromKey('test-id'),
    };

    const refPayload = serializeSchema(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      entity: [{ id: entityType.idFromKey('test-id'), name: 'test-name' }],
      ref: 'test-name',
    });
  });

  it('should work with a multiple references', () => {
    const entityType = createEntityType('entity');
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(
            z.object({
              id: z.string(),
              name: z.string(),
            }),
            { type: entityType },
          ),
        ),
        nestedRef: z.object({
          ref: ctx.withRef({
            type: entityType,
            onDelete: 'RESTRICT',
          }),
        }),
        ref: ctx.withRef({
          type: entityType,
          onDelete: 'RESTRICT',
        }),
      }),
    );

    const data = {
      entity: [
        { id: entityType.idFromKey('test-id1'), name: 'test-name' },
        { id: entityType.idFromKey('test-id2'), name: 'test-name2' },
        { id: entityType.idFromKey('test-id3'), name: 'test-name3' },
      ],
      nestedRef: {
        ref: entityType.idFromKey('test-id2'),
      },
      ref: entityType.idFromKey('test-id3'),
    };

    const refPayload = serializeSchema(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      entity: [
        { id: entityType.idFromKey('test-id1'), name: 'test-name' },
        { id: entityType.idFromKey('test-id2'), name: 'test-name2' },
        { id: entityType.idFromKey('test-id3'), name: 'test-name3' },
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
    const modelSlot = createRefContextSlot(modelType);
    const foreignModelSlot = createRefContextSlot(modelType);
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        models: z.array(
          ctx.withEnt(
            z.object({
              id: z.string(),
              name: z.string(),
              fields: z.array(
                ctx.withEnt(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                  }),
                  { type: fieldType, parentRef: modelSlot },
                ),
              ),
              relations: z.array(
                z.object({
                  modelName: ctx.withRef({
                    type: modelType,
                    onDelete: 'RESTRICT',
                    provides: foreignModelSlot,
                  }),
                  fields: z.array(
                    ctx.withRef({
                      type: fieldType,
                      onDelete: 'RESTRICT',
                      parentRef: foreignModelSlot,
                    }),
                  ),
                }),
              ),
            }),
            { type: modelType, provides: modelSlot },
          ),
        ),
      }),
    );

    const data = {
      models: [
        {
          id: modelType.idFromKey('model-todo'),
          name: 'todo',
          fields: [
            { id: fieldType.idFromKey('todo-title'), name: 'title' },
            { id: fieldType.idFromKey('todo-id'), name: 'id' },
          ],
          relations: [
            {
              modelName: modelType.idFromKey('model-todoList'),
              fields: [fieldType.idFromKey('todoList-id')],
            },
          ],
        },
        {
          id: modelType.idFromKey('model-todoList'),
          name: 'todoList',
          fields: [
            { id: fieldType.idFromKey('todoList-title'), name: 'title' },
            { id: fieldType.idFromKey('todoList-id'), name: 'id' },
          ],
          relations: [],
        },
      ],
    };

    const refPayload = serializeSchema(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      models: [
        {
          id: modelType.idFromKey('model-todo'),
          name: 'todo',
          fields: [
            { id: fieldType.idFromKey('todo-title'), name: 'title' },
            { id: fieldType.idFromKey('todo-id'), name: 'id' },
          ],
          relations: [{ modelName: 'todoList', fields: ['id'] }],
        },
        {
          id: modelType.idFromKey('model-todoList'),
          name: 'todoList',
          fields: [
            { id: fieldType.idFromKey('todoList-title'), name: 'title' },
            { id: fieldType.idFromKey('todoList-id'), name: 'id' },
          ],
          relations: [],
        },
      ],
    });
  });
});
