import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { SchemaNodeVisitor } from './walk-data-with-schema.js';

import { walkDataWithSchema } from './walk-data-with-schema.js';

// ---------------------------------------------------------------------------
// walkDataWithSchema — helpers
// ---------------------------------------------------------------------------

/** Creates a visitor that records every (path, schemaType) pair it sees. */
function makeRecordingVisitor(): SchemaNodeVisitor & {
  calls: { path: (string | number)[]; type: string }[];
} {
  const calls: { path: (string | number)[]; type: string }[] = [];
  return {
    calls,
    visit(schema, _data, ctx) {
      calls.push({ path: [...ctx.path], type: schema._zod.def.type });
      return undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// walkDataWithSchema — simple schema types
// ---------------------------------------------------------------------------

describe('walkDataWithSchema — simple schemas', () => {
  it('visits a flat object and all its fields', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { name: 'alice', age: 30 }, [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'object' },
      { path: ['name'], type: 'string' },
      { path: ['age'], type: 'number' },
    ]);
  });

  it('visits array elements with numeric path segments', () => {
    const schema = z.object({ tags: z.array(z.string()) });
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { tags: ['a', 'b'] }, [visitor]);

    expect(visitor.calls).toContainEqual({ path: ['tags', 0], type: 'string' });
    expect(visitor.calls).toContainEqual({ path: ['tags', 1], type: 'string' });
  });

  it('unwraps optional/nullable/default wrappers transparently', () => {
    const schema = z.object({
      a: z.string().optional(),
      b: z.number().nullable(),
      c: z.boolean().default(false),
    });
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { a: 'x', b: 1, c: true }, [visitor]);

    const types = visitor.calls.map((c) => c.type);
    expect(types).toContain('string');
    expect(types).toContain('number');
    expect(types).toContain('boolean');
    // wrapper nodes are visited too
    expect(types).toContain('optional');
    expect(types).toContain('nullable');
    expect(types).toContain('default');
  });

  it('skips optional/nullable fields when data is absent', () => {
    const schema = z.object({ a: z.string().optional() });
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, {}, [visitor]);

    // 'optional' wrapper is visited but inner 'string' is not
    expect(
      visitor.calls.some((c) => c.path[0] === 'a' && c.type === 'optional'),
    ).toBe(true);
    expect(visitor.calls.some((c) => c.type === 'string')).toBe(false);
  });

  it('throws for unsupported schema types', () => {
    // z.transform() compiles to a "pipe" in Zod 4
    const schema = z.string().transform((s) => s.toUpperCase());
    expect(() => {
      walkDataWithSchema(schema, 'hello', [makeRecordingVisitor()]);
    }).toThrow('is not supported in definition schemas');
  });

  it('throws for plain z.union() with non-leaf options', () => {
    const schema = z.union([z.string(), z.number()]);
    expect(() => {
      walkDataWithSchema(schema, 'hello', [makeRecordingVisitor()]);
    }).toThrow('Plain z.union() is not supported');
  });

  it('allows plain z.union() when all options are string/enum/literal', () => {
    const schema = z.union([z.string(), z.literal('foo'), z.enum(['a', 'b'])]);
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, 'foo', [visitor]);

    expect(visitor.calls).toEqual([{ path: [], type: 'union' }]);
  });

  it('visits tuple items with correct indices', () => {
    const schema = z.tuple([z.string(), z.number(), z.boolean()]);
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, ['hello', 42, true], [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'tuple' },
      { path: [0], type: 'string' },
      { path: [1], type: 'number' },
      { path: [2], type: 'boolean' },
    ]);
  });

  it('skips tuple items beyond data length', () => {
    const schema = z.tuple([z.string(), z.number()]);
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, ['only-one'], [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'tuple' },
      { path: [0], type: 'string' },
    ]);
  });

  it('does not descend into tuple when data is not an array', () => {
    const schema = z.tuple([z.string()]);
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, null, [visitor]);

    expect(visitor.calls).toEqual([{ path: [], type: 'tuple' }]);
  });

  it('visits record values with string keys as path segments', () => {
    const schema = z.record(z.string(), z.number());
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { x: 1, y: 2 }, [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'record' },
      { path: ['x'], type: 'number' },
      { path: ['y'], type: 'number' },
    ]);
  });

  it('does not descend into record when data is null', () => {
    const schema = z.record(z.string(), z.number());
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, null, [visitor]);

    expect(visitor.calls).toEqual([{ path: [], type: 'record' }]);
  });
});

// ---------------------------------------------------------------------------
// walkDataWithSchema — cleanup (entry/exit)
// ---------------------------------------------------------------------------

describe('walkDataWithSchema — cleanup functions', () => {
  it('calls cleanup after children are visited', () => {
    const log: string[] = [];
    const schema = z.object({ child: z.string() });

    const visitor: SchemaNodeVisitor = {
      visit(_schema, _data, ctx) {
        const depth = ctx.path.length;
        log.push(`enter:${depth}`);
        return () => log.push(`exit:${depth}`);
      },
    };

    walkDataWithSchema(schema, { child: 'x' }, [visitor]);

    // object entered, then child entered, child exited, object exited
    expect(log).toEqual(['enter:0', 'enter:1', 'exit:1', 'exit:0']);
  });

  it('only runs cleanup when visitor returns one', () => {
    const cleanupCalled = vi.fn();
    const schema = z.object({ a: z.string(), b: z.number() });

    const visitor: SchemaNodeVisitor = {
      visit(_schema, _data, ctx) {
        // Only return cleanup for the root node
        if (ctx.path.length === 0) return cleanupCalled;
        return undefined;
      },
    };

    walkDataWithSchema(schema, { a: 'x', b: 1 }, [visitor]);
    expect(cleanupCalled).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// walkDataWithSchema — complex schemas
// ---------------------------------------------------------------------------

describe('walkDataWithSchema — complex schemas', () => {
  it('walks a nested object tree, visiting nodes depth-first', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        address: z.object({ city: z.string() }),
      }),
    });

    const visitor = makeRecordingVisitor();
    walkDataWithSchema(
      schema,
      { user: { name: 'alice', address: { city: 'sf' } } },
      [visitor],
    );

    const paths = visitor.calls.map((c) => c.path.join('.'));
    // depth-first: parent always before children
    expect(paths.indexOf('')).toBeLessThan(paths.indexOf('user'));
    expect(paths.indexOf('user')).toBeLessThan(paths.indexOf('user.name'));
    expect(paths.indexOf('user')).toBeLessThan(paths.indexOf('user.address'));
    expect(paths.indexOf('user.address')).toBeLessThan(
      paths.indexOf('user.address.city'),
    );
  });

  it('walks a discriminated union, visiting only the matching branch', () => {
    const circle = z.object({ shape: z.literal('circle'), radius: z.number() });
    const rect = z.object({
      shape: z.literal('rect'),
      width: z.number(),
      height: z.number(),
    });
    const schema = z.discriminatedUnion('shape', [circle, rect]);

    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { shape: 'circle', radius: 5 }, [visitor]);

    const types = visitor.calls.map((c) => c.type);
    // circle branch visited: object + shape literal + radius number
    expect(types).toContain('object');
    expect(types).toContain('literal');
    expect(types).toContain('number');
    // rect-only field 'width' path not visited
    expect(visitor.calls.some((c) => c.path.includes('width'))).toBe(false);
  });

  it('walks a tuple with rest elements', () => {
    const schema = z.tuple([z.string()]).rest(z.number());
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, ['hello', 1, 2, 3], [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'tuple' },
      { path: [0], type: 'string' },
      { path: [1], type: 'number' },
      { path: [2], type: 'number' },
      { path: [3], type: 'number' },
    ]);
  });

  it('walks a record with nested object values', () => {
    const schema = z.record(
      z.string(),
      z.object({ name: z.string(), count: z.number() }),
    );
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(
      schema,
      { foo: { name: 'a', count: 1 }, bar: { name: 'b', count: 2 } },
      [visitor],
    );

    expect(visitor.calls).toContainEqual({
      path: ['foo'],
      type: 'object',
    });
    expect(visitor.calls).toContainEqual({
      path: ['foo', 'name'],
      type: 'string',
    });
    expect(visitor.calls).toContainEqual({
      path: ['bar', 'count'],
      type: 'number',
    });
  });

  it('walks a plain leaf union inside an object field', () => {
    const schema = z.object({
      status: z.union([z.literal('active'), z.literal('inactive')]),
    });
    const visitor = makeRecordingVisitor();
    walkDataWithSchema(schema, { status: 'active' }, [visitor]);

    expect(visitor.calls).toEqual([
      { path: [], type: 'object' },
      { path: ['status'], type: 'union' },
    ]);
  });

  it('walks an array of objects with slot-scope-style cleanup correctly', () => {
    // Simulates a visitor that maintains a stack updated on entry and restored on exit
    const schema = z.object({
      items: z.array(z.object({ id: z.string(), value: z.number() })),
    });

    const scopeLog: string[] = [];
    let depth = 0;

    const visitor: SchemaNodeVisitor = {
      visit(_schema, _data, ctx) {
        depth++;
        const myDepth = depth;
        scopeLog.push(`enter:${ctx.path.join('.') || 'root'}(d=${myDepth})`);
        return () => {
          scopeLog.push(`exit:${ctx.path.join('.') || 'root'}(d=${myDepth})`);
          depth--;
        };
      },
    };

    walkDataWithSchema(schema, { items: [{ id: 'a', value: 1 }] }, [visitor]);

    // Every enter must have a matching exit in reverse order
    const enters = scopeLog.filter((e) => e.startsWith('enter'));
    const exits = scopeLog.filter((e) => e.startsWith('exit'));
    expect(exits.length).toBe(enters.length);
    // depth returns to 0 after walk
    expect(depth).toBe(0);
  });
});
