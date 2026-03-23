import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { findOrphanedUnionItems } from './find-orphaned-union-items.js';

// ---------------------------------------------------------------------------
// Test schemas
// ---------------------------------------------------------------------------

const catSchema = z.object({ type: z.literal('cat'), meow: z.string() });
const dogSchema = z.object({ type: z.literal('dog'), bark: z.string() });

/** A discriminated union with only cat and dog (fish removed). */
const animalUnion = z.discriminatedUnion('type', [catSchema, dogSchema]);

// ---------------------------------------------------------------------------
// findOrphanedUnionItems
// ---------------------------------------------------------------------------

describe('findOrphanedUnionItems', () => {
  it('returns empty array when all items match', () => {
    const schema = z.object({ animal: animalUnion });
    const data = { animal: { type: 'cat', meow: 'loud' } };

    expect(findOrphanedUnionItems(schema, data)).toEqual([]);
  });

  it('detects an orphaned item when its type is not in the union', () => {
    const schema = z.object({ animal: animalUnion });
    const data = { animal: { type: 'fish', swim: 'fast' } };

    const result = findOrphanedUnionItems(schema, data);
    expect(result).toEqual([
      {
        path: ['animal'],
        discriminator: 'type',
        discriminatorValue: 'fish',
      },
    ]);
  });

  it('detects orphaned items inside arrays', () => {
    const schema = z.object({ animals: z.array(animalUnion) });
    const data = {
      animals: [
        { type: 'cat', meow: 'loud' },
        { type: 'fish', swim: 'fast' },
        { type: 'dog', bark: 'woof' },
      ],
    };

    const result = findOrphanedUnionItems(schema, data);
    expect(result).toEqual([
      {
        path: ['animals', 1],
        discriminator: 'type',
        discriminatorValue: 'fish',
      },
    ]);
  });

  it('detects multiple orphaned items at different paths', () => {
    const limitedUnion = z.discriminatedUnion('type', [catSchema]);
    const schema = z.object({ animals: z.array(limitedUnion) });
    const data = {
      animals: [
        { type: 'dog', bark: 'woof' },
        { type: 'cat', meow: 'loud' },
        { type: 'bird', fly: 'high' },
      ],
    };

    const result = findOrphanedUnionItems(schema, data);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      path: ['animals', 0],
      discriminator: 'type',
      discriminatorValue: 'dog',
    });
    expect(result).toContainEqual({
      path: ['animals', 2],
      discriminator: 'type',
      discriminatorValue: 'bird',
    });
  });

  it('skips items with missing discriminator field (not an orphan)', () => {
    const schema = z.object({ animal: animalUnion });
    const data = { animal: { name: 'unknown' } };

    expect(findOrphanedUnionItems(schema, data)).toEqual([]);
  });

  it('skips null/undefined data gracefully', () => {
    const schema = z.object({
      animal: animalUnion.optional(),
    });

    expect(findOrphanedUnionItems(schema, { animal: undefined })).toEqual([]);
    expect(findOrphanedUnionItems(schema, { animal: null })).toEqual([]);
  });

  it('handles nested objects containing discriminated unions', () => {
    const schema = z.object({
      farm: z.object({
        pets: z.array(animalUnion),
      }),
    });
    const data = {
      farm: {
        pets: [{ type: 'fish', swim: 'fast' }],
      },
    };

    const result = findOrphanedUnionItems(schema, data);
    expect(result).toEqual([
      {
        path: ['farm', 'pets', 0],
        discriminator: 'type',
        discriminatorValue: 'fish',
      },
    ]);
  });

  it('returns empty for schemas without discriminated unions', () => {
    const schema = z.object({
      name: z.string(),
      tags: z.array(z.string()),
    });
    const data = { name: 'test', tags: ['a', 'b'] };

    expect(findOrphanedUnionItems(schema, data)).toEqual([]);
  });

  it('handles records with discriminated union values', () => {
    const schema = z.object({
      animals: z.record(z.string(), animalUnion),
    });
    const data = {
      animals: {
        pet1: { type: 'cat', meow: 'soft' },
        pet2: { type: 'fish', swim: 'slow' },
      },
    };

    const result = findOrphanedUnionItems(schema, data);
    expect(result).toEqual([
      {
        path: ['animals', 'pet2'],
        discriminator: 'type',
        discriminatorValue: 'fish',
      },
    ]);
  });

  it('descends into matching union branches to find nested orphans', () => {
    const innerUnion = z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('small') }),
    ]);
    const outerSchema = z.object({
      animals: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('cat'),
            details: innerUnion,
          }),
        ]),
      ),
    });
    const data = {
      animals: [
        {
          type: 'cat',
          details: { kind: 'large' },
        },
      ],
    };

    const result = findOrphanedUnionItems(outerSchema, data);
    expect(result).toEqual([
      {
        path: ['animals', 0, 'details'],
        discriminator: 'kind',
        discriminatorValue: 'large',
      },
    ]);
  });
});
