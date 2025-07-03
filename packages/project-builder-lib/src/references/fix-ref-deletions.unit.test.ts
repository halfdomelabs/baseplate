import assert from 'node:assert';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { PluginImplementationStore } from '#src/plugins/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { fixRefDeletions } from './fix-ref-deletions.js';
import { createEntityType } from './types.js';

describe('fixRefDeletions', () => {
  const pluginStore = new PluginImplementationStore({});
  it('should work with a no-reference object', () => {
    const schemaCreator = definitionSchema(() =>
      z.object({
        test: z.string(),
      }),
    );

    const refPayload = fixRefDeletions(
      schemaCreator,
      { test: 'hi' },
      {
        plugins: pluginStore,
      },
    );

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        test: 'hi',
      },
    });
  });

  it('should work with a simple CASCADE reference', () => {
    const entityType = createEntityType('entity');
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        refs: z.array(
          ctx.withRef(z.string(), {
            type: entityType,
            onDelete: 'DELETE',
          }),
        ),
      }),
    );

    const data = {
      entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
      refs: [entityType.idFromKey('test-id')],
    };

    const refPayload = fixRefDeletions(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
        refs: [],
      },
    });
  });

  it('should work with a multiple CASCADE references', () => {
    const entityType = createEntityType('entity');
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        refs: z.array(
          ctx.withRef(z.string(), {
            type: entityType,
            onDelete: 'DELETE',
          }),
        ),
      }),
    );

    const data = {
      entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
      refs: [
        entityType.idFromKey('test-id'),
        entityType.idFromKey('test-id2'),
        entityType.idFromKey('test-id'),
        entityType.idFromKey('test-id2'),
      ],
    };

    const refPayload = fixRefDeletions(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
        refs: [
          entityType.idFromKey('test-id2'),
          entityType.idFromKey('test-id2'),
        ],
      },
    });
  });

  it('should work with a simple SET NULL reference', () => {
    const entityType = createEntityType('entity');
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        refs: z.array(
          ctx.withRef(z.string().nullish(), {
            type: entityType,
            onDelete: 'SET_NULL',
          }),
        ),
      }),
    );

    const data = {
      entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
      refs: [entityType.idFromKey('test-id')],
    };

    const refPayload = fixRefDeletions(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload).toMatchObject({
      type: 'success',
      value: {
        entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
        refs: [null],
      },
    });
  });

  it('should work with a simple RESTRICT reference', () => {
    const entityType = createEntityType('entity');
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        entity: z.array(
          ctx.withEnt(z.object({ id: z.string(), name: z.string() }), {
            type: entityType,
          }),
        ),
        refs: z.array(
          ctx.withRef(z.string(), {
            type: entityType,
            onDelete: 'RESTRICT',
          }),
        ),
      }),
    );

    const data = {
      entity: [{ id: entityType.idFromKey('test-id2'), name: 'test-name' }],
      refs: [entityType.idFromKey('test-id')],
    };

    const refPayload = fixRefDeletions(schemaCreator, data, {
      plugins: pluginStore,
    });

    expect(refPayload.type).toBe('failure');
    assert.ok(refPayload.type === 'failure');

    expect(refPayload.issues[0].ref.path.join('.')).toBe('refs.0');
    expect(refPayload.issues[0].entityId).toBe(entityType.idFromKey('test-id'));
  });
});
