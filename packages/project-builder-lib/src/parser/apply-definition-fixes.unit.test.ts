import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  definitionFixRegistry,
  withFix,
} from '#src/schema/creator/definition-fix-registry.js';

import { applyDefinitionFixes } from './apply-definition-fixes.js';

describe('applyDefinitionFixes', () => {
  it('returns primitive data unchanged', () => {
    const schema = z.string();
    expect(applyDefinitionFixes(schema, 'hello')).toBe('hello');
    expect(applyDefinitionFixes(schema, 42 as unknown)).toBe(42);
    expect(applyDefinitionFixes(schema, null as unknown)).toBe(null);
  });

  it('returns same reference when no fixes are registered', () => {
    const schema = z.object({ name: z.string() });
    const data = { name: 'test' };
    expect(applyDefinitionFixes(schema, data)).toBe(data);
  });

  it('returns same reference when no fixes are needed', () => {
    const innerSchema = z.object({ value: z.number() });
    definitionFixRegistry.add(innerSchema, (value) => value);

    const schema = z.object({ data: innerSchema });
    const data = { data: { value: 42 } };
    expect(applyDefinitionFixes(schema, data)).toBe(data);
  });

  it('applies a fix to a nested value', () => {
    const serviceSchema = z
      .object({
        enabled: z.boolean(),
        config: z.string().optional(),
      })
      .apply(
        withFix((value) => {
          const service = value as { enabled: boolean; config?: string };
          if (!service.enabled && service.config) {
            return { enabled: false };
          }
          return value;
        }),
      );

    const schema = z.object({ service: serviceSchema });

    const result = applyDefinitionFixes(schema, {
      service: { enabled: false, config: 'stale' },
    });
    expect(result).toEqual({ service: { enabled: false } });
  });

  it('preserves unchanged siblings when fixing a value', () => {
    const fixableSchema = z.string().apply(
      withFix((value) => {
        if (value === 'bad') return 'fixed';
        return value;
      }),
    );

    const schema = z.object({
      name: z.string(),
      status: fixableSchema,
    });

    const result = applyDefinitionFixes(schema, {
      name: 'keep',
      status: 'bad',
    });
    expect(result).toEqual({ name: 'keep', status: 'fixed' });
  });

  it('applies multiple fixes from multiple registrations', () => {
    const innerSchema = z.object({
      a: z.number(),
      b: z.number(),
    });

    definitionFixRegistry.add(innerSchema, (value) => {
      const obj = value as { a: number; b: number };
      if (obj.a < 0) return { ...obj, a: 0 };
      return value;
    });

    definitionFixRegistry.add(innerSchema, (value) => {
      const obj = value as { a: number; b: number };
      if (obj.b < 0) return { ...obj, b: 0 };
      return value;
    });

    const schema = z.object({ data: innerSchema });

    const result = applyDefinitionFixes(schema, {
      data: { a: -1, b: -2 },
    });
    expect(result).toEqual({ data: { a: 0, b: 0 } });
  });

  it('does not mutate original data', () => {
    const innerSchema = z.object({ value: z.string() });
    definitionFixRegistry.add(innerSchema, () => ({ value: 'fixed' }));

    const schema = z.object({ data: innerSchema });
    const original = { data: { value: 'original' } };

    const result = applyDefinitionFixes(schema, original);
    expect(result).toEqual({ data: { value: 'fixed' } });
    expect(original).toEqual({ data: { value: 'original' } });
  });

  it('handles root-level fix', () => {
    const schema = z.object({ value: z.string() }).apply(
      withFix((value) => {
        if (value.value === 'bad') return { value: 'fixed' };
        return value;
      }),
    );

    const result = applyDefinitionFixes(schema, { value: 'bad' });
    expect(result).toEqual({ value: 'fixed' });
  });
});
