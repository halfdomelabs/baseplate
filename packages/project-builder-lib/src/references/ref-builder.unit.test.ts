import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  zEnt,
  ZodRefWrapper,
  zRef,
  zRefBuilder,
  zRefId,
} from './ref-builder.js';
import { createEntityType } from './types.js';

describe('ref-builder', () => {
  it('should parse a schema with no references using ZodRefWrapper', () => {
    // A simple schema without any zod-ref enhancements.
    const schema = z.object({
      a: z.string(),
    });
    const payload = ZodRefWrapper.create(schema).parse({ a: 'test' });
    expect(payload.data).toEqual({ a: 'test' });
    expect(payload.entities).toHaveLength(0);
    expect(payload.references).toHaveLength(0);
  });

  it('should collect an entity and resolve a simple reference', () => {
    // Create an entity type.
    const entityType = createEntityType('entity');
    // Build a schema with an entity and a reference field.
    const schema = z.object({
      // zEnt registers an entity. In this case we assume an "id" and "name" are provided.
      entity: zEnt(z.object({ name: z.string() }), { type: entityType }),
      // zRef (via zRefBuilder) registers a reference to an entity.
      ref: zRef(z.string(), {
        type: entityType,
        onDelete: 'RESTRICT',
      }),
    });
    // Input data: entity has an explicit id and name; ref is set to the entity id.
    const input = {
      entity: { id: 'ent-1', name: 'Entity One' },
      ref: 'ent-1',
    };

    // ZodRefWrapper returns a payload containing the parsed data as well as collected entities and references.
    const payload = ZodRefWrapper.create(schema).parse(input);
    // The reference should be resolved to the entity's id.
    expect(payload.data.ref).toEqual('ent-1');
    expect(payload.entities).toHaveLength(1);
    expect(payload.references).toHaveLength(1);
  });

  it('should resolve nested and parent references', () => {
    // Create two entity types: a parent (model) and a child (field) that requires a parent.
    const modelType = createEntityType('model');
    const fieldType = createEntityType('field', { parentType: modelType });
    // Build a schema with a model entity that contains a field entity.
    // The model is registered via zEnt and its context is stored (via addContext).
    // The field uses a parentPath (via a context) to resolve its parent.
    // A separate reference is defined to refer back to the model.
    const schema = z.object({
      model: zEnt(
        z.object({
          name: z.string(),
          // The field is an inner entity that requires a parent reference.
          field: zEnt(z.object({ name: z.string() }), {
            type: fieldType,
            parentPath: { context: 'model' },
          }),
        }),
        { type: modelType, addContext: 'model' },
      ),
      foreignRelation: zRefBuilder(
        z.object({
          modelRef: z.string(),
          fieldRef: zRef(z.string(), {
            type: fieldType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'model' },
          }),
        }),
        (builder) => {
          builder.addReference({
            path: 'fieldRef',
            type: modelType,
            onDelete: 'RESTRICT',
            addContext: 'model',
          });
        },
      ),
    });
    const input = {
      model: {
        id: 'model-1',
        name: 'Model One',
        field: { id: 'field-1', name: 'Field One' },
      },
      foreignRelation: {
        modelRef: 'model-1',
        fieldRef: 'field-1',
      },
    } satisfies z.infer<typeof schema>;
    const payload = ZodRefWrapper.create(schema, {
      deserialize: true,
    }).parse(input);
    // The reference field should resolve to the model's id.
    expect(payload.data.foreignRelation.modelRef).toEqual('model-1');
    // Verify that the model entity is collected.
    const modelEntity = payload.entities.find((e) => e.id === 'model-1');
    expect(modelEntity).toBeDefined();
  });

  it('should support chaining of zRefBuilder and zRef for multiple references', () => {
    const entityType = createEntityType('entity');
    // Build a schema that registers one entity and two reference fields.
    const schema = z.object({
      entity: zEnt(z.object({ id: zRefId, name: z.string() }), {
        type: entityType,
      }),
      // First reference added via zRefBuilder chaining.
      ref1: zRefBuilder(z.string()).addReference({
        type: entityType,
        onDelete: 'DELETE',
      }),
      // Second reference using the zRef helper.
      ref2: zRef(z.string(), {
        type: entityType,
        onDelete: 'RESTRICT',
      }),
    });
    const input = {
      entity: { id: 'e1', name: 'E1' },
      ref1: 'e1',
      ref2: 'e1',
    };
    const payload = ZodRefWrapper.create(schema).parse(input);
    // Both references should resolve to the entity name.
    expect(payload.data.ref1).toEqual('e1');
    expect(payload.data.ref2).toEqual('e1');
    // Verify that exactly one entity and two references are collected.
    expect(payload.entities).toHaveLength(1);
    expect(payload.references).toHaveLength(2);
  });

  it('should support nameRef functionality for entities', () => {
    const modelType = createEntityType('model');
    const fieldType = createEntityType('field', { parentType: modelType });
    const linkedFieldType = createEntityType('linkedField', {});

    // Create a schema that uses nameRefPath to reference another entity's name
    const schema = z.object({
      model: zEnt(
        z.object({
          name: z.string(),
          field: zEnt(
            z.object({
              name: z.string(),
            }),
            {
              type: fieldType,
              parentPath: { context: 'model' },
            },
          ),
        }),
        {
          type: modelType,
          addContext: 'model',
        },
      ),
      // This entity will reference model.field.name via nameRefPath
      linkedField: zEnt(
        z.object({
          modelRef: z.string(),
          fieldRef: z.string(),
        }),
        {
          type: linkedFieldType,
          nameRefPath: 'fieldRef',
        },
      ).refBuilder((builder) => {
        builder.addReference({
          path: 'fieldRef',
          type: fieldType,
          onDelete: 'RESTRICT',
          parentPath: 'modelRef',
        });
      }),
    });

    const input = {
      model: {
        id: 'model-1',
        name: 'Model One',
        field: {
          id: 'field-1',
          name: 'Field One',
        },
      },
      linkedField: {
        id: 'linked-field-1',
        modelRef: 'model-1',
        fieldRef: 'field-1',
      },
    } satisfies z.infer<typeof schema>;

    const payload = ZodRefWrapper.create(schema).parse(input);

    // Verify the linked field entity uses the referenced field's name
    const linkedFieldEntity = payload.entities.find(
      (e) => e.id === 'linked-field-1',
    );
    expect(linkedFieldEntity).toBeDefined();
    expect(linkedFieldEntity?.name).toBe('Field One');

    // Verify all entities are collected
    expect(payload.entities).toHaveLength(3); // model, field, and linkedField
    expect(payload.references).toHaveLength(1); // fieldRef reference
  });
});
