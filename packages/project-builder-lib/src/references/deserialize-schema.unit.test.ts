import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { deserializeSchemaWithReferences } from './deserialize-schema.js';
import { zRef, zRefId } from './ref-builder.js';
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
        zRef(z.object({ id: zRefId, name: z.string() })).addEntity({
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
        zRef(
          z.object({
            id: zRefId,
            name: z.string(),
          }),
        ).addEntity({
          type: entityType,
        }),
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
});
