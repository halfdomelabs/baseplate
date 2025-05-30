import { describe, expect, it, vi } from 'vitest';
import { type RefinementCtx, z, type ZodInvalidTypeIssue } from 'zod';

import { transformWithDynamicSchema } from './transform-with-dynamic-schema.js';

describe('transformWithDynamicSchema', () => {
  it('should return original data when no schema is provided', () => {
    const transformer = transformWithDynamicSchema<{ foo: string }>(
      () => undefined,
    );
    const data = { foo: 'bar' };
    const ctx: RefinementCtx = { path: [], addIssue: vi.fn() };

    const result = transformer(data, ctx);
    expect(result).toEqual(data);
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it('should transform data when schema is provided', () => {
    const transformer = transformWithDynamicSchema<{ foo: string }>(() =>
      z.object({ foo: z.string().transform((value) => value.toUpperCase()) }),
    );
    const data = { foo: 'bar' };
    const ctx: RefinementCtx = { path: [], addIssue: vi.fn() };

    const result = transformer(data, ctx);
    expect(result).toEqual({ foo: 'BAR' });
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it('should add issues when validation fails', () => {
    const transformer = transformWithDynamicSchema<{ foo: string }>(() =>
      z.object({ foo: z.number() }),
    );
    const data = { foo: 'bar' };
    const issues: ZodInvalidTypeIssue[] = [];
    const ctx: RefinementCtx = {
      path: ['test'],
      addIssue: (issue) => issues.push(issue as ZodInvalidTypeIssue),
    };

    transformer(data, ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].path).toEqual(['foo']);
    expect(issues[0].code).toBe('invalid_type');
  });

  it('should work within a Zod schema transform', () => {
    const baseSchema = z.object({
      id: z.string(),
      type: z.string(),
      value: z.unknown(),
    });

    const schema = baseSchema.transform(
      transformWithDynamicSchema((data) => {
        if (data.type === 'number') {
          return baseSchema.extend({ value: z.number() });
        }
        if (data.type === 'string') {
          return baseSchema.extend({ value: z.string() });
        }
        return undefined;
      }),
    );

    const validNumberData = { id: '1', type: 'number', value: 42 };
    const validStringData = { id: '2', type: 'string', value: 'hello' };
    const invalidData = { id: '3', type: 'number', value: 'not a number' };

    expect(schema.parse(validNumberData)).toEqual(validNumberData);
    expect(schema.parse(validStringData)).toEqual(validStringData);
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it('should validate a specific field when valuePath is provided', () => {
    const schema = z.object({
      nested: z
        .object({
          id: z.string(),
          type: z.string(),
          config: z.record(z.unknown()),
        })
        .transform(
          transformWithDynamicSchema((data) => {
            if (data.type === 'number') {
              return z.object({ value: z.number() });
            }
            if (data.type === 'string') {
              return z.object({ value: z.string() });
            }
            return undefined;
          }, 'config'),
        ),
    });

    const validNumberData = {
      nested: {
        id: '1',
        type: 'number',
        config: { value: 42 },
      },
    };
    const validStringData = {
      nested: {
        id: '2',
        type: 'string',
        config: { value: 'hello' },
      },
    };
    const invalidData = {
      nested: {
        id: '3',
        type: 'number',
        config: { value: 'not a number' },
      },
    };

    expect(schema.parse(validNumberData)).toEqual(validNumberData);
    expect(schema.parse(validStringData)).toEqual(validStringData);
    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0].path).toEqual(['nested', 'config', 'value']);
  });

  it('should handle undefined valuePath field', () => {
    interface TestData {
      id: string;
      type: string;
      config?: Record<string, unknown>;
    }

    const schema = z
      .object({
        id: z.string(),
        type: z.string(),
        config: z.record(z.unknown()).optional(),
      })
      .transform(
        transformWithDynamicSchema<TestData>(
          () => z.object({ value: z.number() }).optional(),
          'config',
        ),
      );

    const data = { id: '1', type: 'number' };
    expect(schema.parse(data)).toEqual(data);
  });
});
