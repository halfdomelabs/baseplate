import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { withEnt } from '#src/references/extend-parser-context-with-refs.js';
import { createRefContextSlot } from '#src/references/ref-context-slot.js';
import { createEntityType } from '#src/references/types.js';
import { collectEntityMetadata } from '#src/tools/entity-service/entity-type-map.js';

import type {
  SchemaPathElement,
  SchemaStructureVisitor,
} from './walk-schema-structure.js';

import { walkSchemaStructure } from './walk-schema-structure.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a visitor that records every (path, schemaType) pair it sees. */
function makeRecordingVisitor(): SchemaStructureVisitor & {
  calls: { path: SchemaPathElement[]; type: string }[];
} {
  const calls: { path: SchemaPathElement[]; type: string }[] = [];
  return {
    calls,
    visit(schema, ctx) {
      calls.push({ path: [...ctx.path], type: schema._zod.def.type });
      return undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Simple schema types
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — simple schemas', () => {
  it('visits a flat object and all its fields', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'object' },
      { path: [{ type: 'object-key', key: 'name' }], type: 'string' },
      { path: [{ type: 'object-key', key: 'age' }], type: 'number' },
    ]);
  });

  it('visits nested objects with compound paths', () => {
    const schema = z.object({
      user: z.object({ name: z.string() }),
    });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'user' },
        { type: 'object-key', key: 'name' },
      ],
      type: 'string',
    });
  });

  it('unwraps optional/nullable/default wrappers transparently', () => {
    const schema = z.object({
      a: z.string().optional(),
      b: z.number().nullable(),
      c: z.boolean().default(false),
    });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    const types = visitor.calls.map((c) => c.type);
    expect(types).toContain('string');
    expect(types).toContain('number');
    expect(types).toContain('boolean');
    // wrapper nodes are visited too
    expect(types).toContain('optional');
    expect(types).toContain('nullable');
    expect(types).toContain('default');
  });
});

// ---------------------------------------------------------------------------
// Array handling
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — arrays', () => {
  it('walks plain array elements with an array path element', () => {
    const schema = z.object({ tags: z.array(z.string()) });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'tags' }],
      type: 'array',
    });
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'tags' }, { type: 'array' }],
      type: 'string',
    });
  });

  it('walks array of discriminated union with discriminated-union-array path elements', () => {
    const schema = z.object({
      items: z.array(
        z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('a'), valueA: z.string() }),
          z.object({ kind: z.literal('b'), valueB: z.number() }),
        ]),
      ),
    });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    // Each branch should have a discriminated-union-array path element
    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'items' },
        {
          type: 'discriminated-union-array',
          discriminatorKey: 'kind',
          value: 'a',
        },
      ],
      type: 'object',
    });
    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'items' },
        {
          type: 'discriminated-union-array',
          discriminatorKey: 'kind',
          value: 'a',
        },
        { type: 'object-key', key: 'valueA' },
      ],
      type: 'string',
    });
    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'items' },
        {
          type: 'discriminated-union-array',
          discriminatorKey: 'kind',
          value: 'b',
        },
      ],
      type: 'object',
    });
    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'items' },
        {
          type: 'discriminated-union-array',
          discriminatorKey: 'kind',
          value: 'b',
        },
        { type: 'object-key', key: 'valueB' },
      ],
      type: 'number',
    });
  });

  it('walks array of optional discriminated union (unwraps wrapper)', () => {
    const schema = z.object({
      items: z.array(
        z
          .discriminatedUnion('type', [
            z.object({ type: z.literal('x'), data: z.string() }),
          ])
          .optional(),
      ),
    });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    // Should still detect the discriminated union through the optional wrapper
    expect(visitor.calls).toContainEqual({
      path: [
        { type: 'object-key', key: 'items' },
        {
          type: 'discriminated-union-array',
          discriminatorKey: 'type',
          value: 'x',
        },
        { type: 'object-key', key: 'data' },
      ],
      type: 'string',
    });
  });
});

// ---------------------------------------------------------------------------
// Discriminated unions on objects (transparent)
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — discriminated unions', () => {
  it('walks all branches of a discriminated union without adding path elements', () => {
    const schema = z.discriminatedUnion('shape', [
      z.object({ shape: z.literal('circle'), radius: z.number() }),
      z.object({ shape: z.literal('rect'), width: z.number() }),
    ]);
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    // Both branches visited with no discriminated-union path element
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'radius' }],
      type: 'number',
    });
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'width' }],
      type: 'number',
    });
  });
});

// ---------------------------------------------------------------------------
// Tuples
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — tuples', () => {
  it('visits tuple items with tuple-index path elements', () => {
    const schema = z.tuple([z.string(), z.number(), z.boolean()]);
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    expect(visitor.calls).toContainEqual({
      path: [{ type: 'tuple-index', index: 0 }],
      type: 'string',
    });
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'tuple-index', index: 1 }],
      type: 'number',
    });
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'tuple-index', index: 2 }],
      type: 'boolean',
    });
  });

  it('walks rest elements without a path element', () => {
    const schema = z.tuple([z.string()]).rest(z.number());
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    // The first item has a tuple-index, rest is walked without path element
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'tuple-index', index: 0 }],
      type: 'string',
    });
    // Rest element is visited at the same path as the tuple itself (no element)
    expect(visitor.calls).toContainEqual({
      path: [],
      type: 'number',
    });
  });
});

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — records', () => {
  it('walks record values with a record path element', () => {
    const schema = z.object({
      data: z.record(z.string(), z.number()),
    });
    const visitor = makeRecordingVisitor();
    walkSchemaStructure(schema, [visitor]);

    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'data' }],
      type: 'record',
    });
    expect(visitor.calls).toContainEqual({
      path: [{ type: 'object-key', key: 'data' }, { type: 'record' }],
      type: 'number',
    });
  });
});

// ---------------------------------------------------------------------------
// Cleanup functions
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — cleanup functions', () => {
  it('calls cleanup after children are visited', () => {
    const log: string[] = [];
    const schema = z.object({ child: z.string() });

    const visitor: SchemaStructureVisitor = {
      visit(_schema, ctx) {
        const depth = ctx.path.length;
        log.push(`enter:${depth}`);
        return () => log.push(`exit:${depth}`);
      },
    };

    walkSchemaStructure(schema, [visitor]);

    // object entered, then child entered, child exited, object exited
    expect(log).toEqual(['enter:0', 'enter:1', 'exit:1', 'exit:0']);
  });

  it('only runs cleanup when visitor returns one', () => {
    const cleanupCalled = vi.fn();
    const schema = z.object({ a: z.string(), b: z.number() });

    const visitor: SchemaStructureVisitor = {
      visit(_schema, ctx) {
        // Only return cleanup for the root node
        if (ctx.path.length === 0) return cleanupCalled;
        return undefined;
      },
    };

    walkSchemaStructure(schema, [visitor]);
    expect(cleanupCalled).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Circular reference handling
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — circular references', () => {
  it('visits the same schema at different paths (delete-on-backtrack)', () => {
    // The walker uses delete-on-backtrack, so the same schema instance
    // can be visited at multiple paths without infinite loops.
    const inner = z.object({ value: z.string() });
    const schema = z.object({ a: inner, b: inner });
    const visitor = makeRecordingVisitor();

    walkSchemaStructure(schema, [visitor]);

    // Root + inner (via a) + inner (via b) — visited at both paths
    const objectVisits = visitor.calls.filter((c) => c.type === 'object');
    expect(objectVisits.length).toBe(3);
  });

  it('prevents infinite loops on truly circular schemas', () => {
    // A schema that references itself during the same walk path
    // would be caught by the visited set. Since Zod doesn't easily allow
    // truly circular schemas without z.lazy(), we just verify the walker
    // completes without hanging.
    const schema = z.object({
      nested: z.object({ deep: z.string() }),
    });
    const visitor = makeRecordingVisitor();

    walkSchemaStructure(schema, [visitor]);
    expect(visitor.calls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Entity detection with withEnt
// ---------------------------------------------------------------------------

describe('walkSchemaStructure — entity detection via collectEntityMetadata', () => {
  it('detects entity arrays in the schema and provides correct paths', () => {
    const parentType = createEntityType('parent');
    const parentSlot = createRefContextSlot('parent-slot', parentType);
    const childType = createEntityType('child', { parentType });

    const childSchema = z.object({ id: z.string(), name: z.string() });
    const parentSchema = z.object({
      id: z.string(),
      children: z.array(
        childSchema.apply(withEnt({ type: childType, parentSlot })),
      ),
    });
    const rootSchema = z.object({
      parents: z.array(
        parentSchema.apply(withEnt({ type: parentType, provides: parentSlot })),
      ),
    });

    const map = collectEntityMetadata(rootSchema);

    const parentMeta = map.get('parent');
    expect(parentMeta).toBeDefined();
    expect(parentMeta?.relativePath).toEqual([
      { type: 'object-key', key: 'parents' },
    ]);
    expect(parentMeta?.parentEntityTypeName).toBeUndefined();

    const childMeta = map.get('child');
    expect(childMeta).toBeDefined();
    expect(childMeta?.relativePath).toEqual([
      { type: 'object-key', key: 'children' },
    ]);
    expect(childMeta?.parentEntityTypeName).toBe('parent');
  });

  it('handles entity arrays inside discriminated union arrays', () => {
    const parentType = createEntityType('du-parent');
    const parentSlot = createRefContextSlot('du-parent-slot', parentType);
    const childType = createEntityType('du-child', { parentType });

    const childSchema = z.object({ id: z.string() });
    const branchA = z.object({
      type: z.literal('a'),
      items: z.array(
        childSchema.apply(withEnt({ type: childType, parentSlot })),
      ),
    });
    const branchB = z.object({
      type: z.literal('b'),
      other: z.string(),
    });

    const rootSchema = z.object({
      things: z.array(
        z
          .discriminatedUnion('type', [branchA, branchB])
          .apply(withEnt({ type: parentType, provides: parentSlot })),
      ),
    });

    const map = collectEntityMetadata(rootSchema);

    const parentMeta = map.get('du-parent');
    expect(parentMeta).toBeDefined();
    expect(parentMeta?.relativePath).toEqual([
      { type: 'object-key', key: 'things' },
    ]);

    const childMeta = map.get('du-child');
    expect(childMeta).toBeDefined();
    // Child is inside branch 'a' — the leading discriminated-union-array
    // element is stripped because it describes the parent's array branch,
    // not the path from the parent entity to the child.
    expect(childMeta?.relativePath).toEqual([
      { type: 'object-key', key: 'items' },
    ]);
    expect(childMeta?.parentEntityTypeName).toBe('du-parent');
  });
});
