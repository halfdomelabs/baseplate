import assert from 'assert';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { fixRefDeletions } from './fix-ref-deletions.js';
import { zEnt, zRef } from './ref-builder.js';
import { createEntityType } from './types.js';

describe('fixRefDeletions', () => {
  it('should work with a no-reference object', () => {
    const schema = z.object({
      test: z.string(),
    });

    const refPayload = fixRefDeletions(schema, {
      test: 'hi',
    });

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        test: 'hi',
      },
    });
  });

  it('should work with a simple CASCADE reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ name: z.string() }), {
          type: entityType,
        }),
      ),
      refs: z.array(
        zRef(z.string()).addReference({
          type: entityType,
          onDelete: 'DELETE',
        }),
      ),
    });
    const data: z.TypeOf<typeof schema> = {
      entity: [{ id: 'test-id2', name: 'test-name' }],
      refs: ['test-id'],
    };

    const refPayload = fixRefDeletions(schema, data);

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        entity: [{ id: 'test-id2', name: 'test-name' }],
        refs: [],
      },
    });
  });

  it('should work with a simple SET NULL reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ name: z.string() }), {
          type: entityType,
        }),
      ),
      refs: z.array(
        zRef(z.string().nullish()).addReference({
          type: entityType,
          onDelete: 'SET_NULL',
        }),
      ),
    });
    const data: z.TypeOf<typeof schema> = {
      entity: [{ id: 'test-id2', name: 'test-name' }],
      refs: ['test-id'],
    };

    const refPayload = fixRefDeletions(schema, data);

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        entity: [{ id: 'test-id2', name: 'test-name' }],
        refs: [null],
      },
    });
  });

  it('should work with a simple RESTRICT reference', () => {
    const entityType = createEntityType('entity');
    const schema = z.object({
      entity: z.array(
        zEnt(z.object({ name: z.string() }), {
          type: entityType,
        }),
      ),
      refs: z.array(
        zRef(z.string()).addReference({
          type: entityType,
          onDelete: 'RESTRICT',
        }),
      ),
    });
    const data: z.TypeOf<typeof schema> = {
      entity: [{ id: 'test-id2', name: 'test-name' }],
      refs: ['test-id'],
    };

    const refPayload = fixRefDeletions(schema, data);

    expect(refPayload.type).toBe('failure');
    assert(refPayload.type === 'failure');

    expect(refPayload.issues[0].ref.path.join('.')).toBe('refs.0');
    expect(refPayload.issues[0].entityId).toBe('test-id');
  });
});
