import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { transformDataWithSchema } from './transform-data-with-schema.js';

describe('transformDataWithSchema', () => {
  it('returns same reference with identity transform', () => {
    const schema = z.object({ name: z.string(), count: z.number() });
    const data = { name: 'test', count: 42 };

    const result = transformDataWithSchema(schema, data, (value) => value);
    expect(result).toBe(data);
  });

  it('transforms a leaf field value', () => {
    const schema = z.object({ name: z.string() });
    const data = { name: 'hello' };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'string') {
        return (value as string).toUpperCase();
      }
      return value;
    });
    expect(result).toEqual({ name: 'HELLO' });
  });

  it('transforms bottom-up: children before parent', () => {
    const order: string[] = [];

    const childSchema = z.object({ value: z.number() });
    const parentSchema = z.object({ child: childSchema });

    transformDataWithSchema(
      parentSchema,
      { child: { value: 1 } },
      (value, ctx) => {
        order.push(ctx.path.join('.') || 'root');
        return value;
      },
    );

    // Leaf 'value' visited first, then 'child' object, then root
    expect(order).toEqual(['child.value', 'child', 'root']);
  });

  it('parent transform sees already-fixed children', () => {
    const childSchema = z.object({
      enabled: z.boolean(),
      config: z.string().optional(),
    });
    const parentSchema = z.object({ service: childSchema });

    const data = {
      service: { enabled: false, config: 'stale' },
    };

    let parentSawFixedChild = false;

    const result = transformDataWithSchema(parentSchema, data, (value, ctx) => {
      if (ctx.path.join('.') === 'service') {
        // Child fix: clear config when disabled
        const service = value as { enabled: boolean; config?: string };
        if (!service.enabled) {
          return { enabled: false };
        }
      }
      if (ctx.path.length === 0) {
        // Parent transform: should see the already-fixed child
        const parent = value as {
          service: { enabled: boolean; config?: string };
        };
        parentSawFixedChild = parent.service.config === undefined;
      }
      return value;
    });

    expect(parentSawFixedChild).toBe(true);
    expect(result).toEqual({ service: { enabled: false } });
  });

  it('transforms array elements', () => {
    const schema = z.object({ items: z.array(z.number()) });
    const data = { items: [1, 2, 3] };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'number') {
        return (value as number) * 2;
      }
      return value;
    });
    expect(result).toEqual({ items: [2, 4, 6] });
  });

  it('handles discriminated unions (only matching branch)', () => {
    const schema = z.object({
      item: z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), val: z.string() }),
        z.object({ type: z.literal('b'), val: z.number() }),
      ]),
    });

    const data = { item: { type: 'a' as const, val: 'hello' } };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'string' && ctx.path.at(-1) === 'val') {
        return (value as string).toUpperCase();
      }
      return value;
    });

    expect(result).toEqual({ item: { type: 'a', val: 'HELLO' } });
  });

  it('preserves structural sharing for unchanged subtrees', () => {
    const schema = z.object({
      unchanged: z.object({ a: z.string() }),
      changed: z.object({ b: z.string() }),
    });

    const data = {
      unchanged: { a: 'keep' },
      changed: { b: 'modify' },
    };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.path.join('.') === 'changed.b') {
        return 'modified';
      }
      return value;
    });

    // Changed subtree is new
    expect(result.changed).toEqual({ b: 'modified' });
    expect(result.changed).not.toBe(data.changed);
    // Unchanged subtree preserves reference
    expect(result.unchanged).toBe(data.unchanged);
  });

  it('handles root-level transform', () => {
    const schema = z.object({ value: z.string() });
    const data = { value: 'test' };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.path.length === 0) {
        return { value: 'replaced' };
      }
      return value;
    });

    expect(result).toEqual({ value: 'replaced' });
  });

  it('handles optional wrapper types', () => {
    const schema = z.object({
      name: z.string().optional(),
    });

    const data = { name: 'test' };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'string') {
        return (value as string).toUpperCase();
      }
      return value;
    });

    expect(result).toEqual({ name: 'TEST' });
  });

  it('skips optional values that are undefined', () => {
    const schema = z.object({
      name: z.string().optional(),
    });

    const data = { name: undefined };
    const calls: string[] = [];

    transformDataWithSchema(schema, data, (value, ctx) => {
      calls.push(`${ctx.path.join('.') || 'root'}:${ctx.schema._zod.def.type}`);
      return value;
    });

    // Should see root object + the optional wrapper, but not descend
    // into the string since value is undefined
    expect(calls).toContain('root:object');
    expect(calls).toContain('name:optional');
    expect(calls).not.toContain('name:string');
  });

  it('handles records', () => {
    const schema = z.record(z.string(), z.number());
    const data = { a: 1, b: 2 };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'number') {
        return (value as number) + 10;
      }
      return value;
    });

    expect(result).toEqual({ a: 11, b: 12 });
  });

  it('removes object keys when transform returns undefined', () => {
    const schema = z.object({
      keep: z.string(),
      remove: z.string(),
    });

    const data = { keep: 'yes', remove: 'no' };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (
        ctx.path.at(-1) === 'remove' &&
        ctx.schema._zod.def.type === 'string'
      ) {
        return undefined;
      }
      return value;
    });

    expect(result).toEqual({ keep: 'yes' });
    expect('remove' in (result as Record<string, unknown>)).toBe(false);
  });

  it('keeps undefined in arrays (preserves indices)', () => {
    const schema = z.array(z.number());
    const data = [1, 2, 3];

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'number' && (value as number) === 2) {
        return undefined;
      }
      return value;
    });

    expect(result).toEqual([1, undefined, 3]);
    expect(result).toHaveLength(3);
  });

  it('preserves extra keys not in schema shape', () => {
    const schema = z.object({ known: z.string() });
    const data = { known: 'value', extra: 'preserved' };

    const result = transformDataWithSchema(schema, data, (value, ctx) => {
      if (ctx.schema._zod.def.type === 'string') {
        return (value as string).toUpperCase();
      }
      return value;
    });

    expect(result).toEqual({ known: 'VALUE', extra: 'preserved' });
  });

  it('handles nested transforms with multiple fix levels', () => {
    const innerSchema = z.object({
      items: z.array(z.number()),
    });
    const outerSchema = z.object({
      data: innerSchema,
    });

    // Fixes at array element level (double values) and at inner object
    // level (add a computed total). Parent should see doubled items.
    let innerItemsAtDataLevel: number[] = [];

    const result = transformDataWithSchema(
      outerSchema,
      { data: { items: [1, 2, 3] } },
      (value, ctx) => {
        // Double all numbers
        if (ctx.schema._zod.def.type === 'number') {
          return (value as number) * 2;
        }
        // At the inner object, capture items to verify they are already doubled
        if (ctx.path.join('.') === 'data') {
          const inner = value as { items: number[] };
          innerItemsAtDataLevel = [...inner.items];
        }
        return value;
      },
    );

    expect(innerItemsAtDataLevel).toEqual([2, 4, 6]);
    expect(result).toEqual({ data: { items: [2, 4, 6] } });
  });
});
