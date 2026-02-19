import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { definitionDefaultRegistry } from '#src/schema/creator/definition-default-registry.js';

import { cleanDefaultValues } from './clean-default-values.js';

/**
 * Helper: creates a schema field with a registered default for strip mode.
 * Mirrors what `withDefault()` does in strip mode.
 */
function withDefault<T extends z.ZodType>(
  schema: T,
  defaultValue: z.input<T>,
): z.ZodOptional<z.ZodPrefault<T>> {
  const result = schema.prefault(defaultValue).optional();
  definitionDefaultRegistry.set(result, { defaultValue });
  return result;
}

// ---------------------------------------------------------------------------
// cleanDefaultValues
// ---------------------------------------------------------------------------

describe('cleanDefaultValues', () => {
  it('returns primitive data unchanged', () => {
    const schema = z.string();
    expect(cleanDefaultValues(schema, 'hello')).toBe('hello');
    expect(cleanDefaultValues(schema, 42 as unknown)).toBe(42);
    expect(cleanDefaultValues(schema, null as unknown)).toBe(null);
  });

  it('strips fields matching their registered default', () => {
    const schema = z.object({
      name: z.string(),
      color: withDefault(z.string(), 'blue'),
    });

    const result = cleanDefaultValues(schema, { name: 'test', color: 'blue' });
    expect(result).toEqual({ name: 'test' });
  });

  it('preserves fields that do not match their default', () => {
    const schema = z.object({
      name: z.string(),
      color: withDefault(z.string(), 'blue'),
    });

    const result = cleanDefaultValues(schema, { name: 'test', color: 'red' });
    expect(result).toEqual({ name: 'test', color: 'red' });
  });

  it('strips values that deeply equal their default', () => {
    const schema = z.object({
      tags: withDefault(z.array(z.string()), []),
      label: withDefault(z.string(), ''),
    });

    const result = cleanDefaultValues(schema, { tags: [], label: '' });
    expect(result).toEqual({});
  });

  it('preserves empty values that do not match their default', () => {
    const schema = z.object({
      tags: withDefault(z.array(z.string()), ['a']),
      label: withDefault(z.string(), 'untitled'),
    });

    const result = cleanDefaultValues(schema, { tags: [], label: '' });
    expect(result).toEqual({ tags: [], label: '' });
  });

  it('cascades: strips parent when cleaned result matches its registered default', () => {
    const schema = z.object({
      name: z.string(),
      settings: withDefault(
        z.object({
          theme: withDefault(z.string(), 'light'),
          fontSize: withDefault(z.number(), 14),
        }),
        {},
      ),
    });

    const result = cleanDefaultValues(schema, {
      name: 'test',
      settings: { theme: 'light', fontSize: 14 },
    });
    expect(result).toEqual({ name: 'test' });
  });

  it('does not cascade when parent has no registered default', () => {
    const schema = z.object({
      name: z.string(),
      settings: z.object({
        theme: withDefault(z.string(), 'light'),
        fontSize: withDefault(z.number(), 14),
      }),
    });

    const result = cleanDefaultValues(schema, {
      name: 'test',
      settings: { theme: 'light', fontSize: 14 },
    });
    expect(result).toEqual({ name: 'test', settings: {} });
  });

  it('cascades multiple levels deep via registered defaults', () => {
    const schema = z.object({
      outer: withDefault(
        z.object({
          inner: withDefault(
            z.object({
              value: withDefault(z.string(), 'default'),
            }),
            {},
          ),
        }),
        {},
      ),
    });

    const result = cleanDefaultValues(schema, {
      outer: { inner: { value: 'default' } },
    });
    expect(result).toEqual({});
  });

  it('does not cascade when some children remain', () => {
    const schema = z.object({
      settings: z.object({
        theme: withDefault(z.string(), 'light'),
        custom: z.string(),
      }),
    });

    const result = cleanDefaultValues(schema, {
      settings: { theme: 'light', custom: 'yes' },
    });
    expect(result).toEqual({ settings: { custom: 'yes' } });
  });

  it('cleans array elements in place without removing them', () => {
    const schema = z.object({
      items: z.array(
        z.object({
          value: withDefault(z.string(), 'default'),
          label: z.string(),
        }),
      ),
    });

    const result = cleanDefaultValues(schema, {
      items: [
        { value: 'default', label: 'first' },
        { value: 'custom', label: 'second' },
      ],
    });
    expect(result).toEqual({
      items: [{ label: 'first' }, { value: 'custom', label: 'second' }],
    });
  });

  it('strips whole array when it matches its registered default', () => {
    const schema = z.object({
      items: withDefault(z.array(z.string()), []),
    });

    const result = cleanDefaultValues(schema, { items: [] });
    expect(result).toEqual({});
  });

  it('returns the same reference when nothing needs cleaning', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const data = { name: 'test', age: 25 };
    const result = cleanDefaultValues(schema, data);
    expect(result).toBe(data);
  });

  it('returns original data when no defaults are registered', () => {
    const schema = z.object({
      name: z.string(),
    });

    const data = { name: 'test' };
    const result = cleanDefaultValues(schema, data);
    expect(result).toBe(data);
  });

  it('cleans array elements in place at root level', () => {
    const schema = z.array(
      z.object({
        value: withDefault(z.string(), 'default'),
      }),
    );

    const result = cleanDefaultValues(schema, [{ value: 'default' }]);
    expect(result).toEqual([{}]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles nested objects with mixed stripping', () => {
    const schema = z.object({
      a: z.object({
        b: withDefault(z.string(), 'x'),
        c: z.string(),
      }),
      d: withDefault(z.string(), 'y'),
    });

    const result = cleanDefaultValues(schema, {
      a: { b: 'x', c: 'keep' },
      d: 'y',
    });
    expect(result).toEqual({ a: { c: 'keep' } });
  });
});
