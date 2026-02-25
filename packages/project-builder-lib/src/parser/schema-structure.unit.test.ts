import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { findDiscriminatedUnionMatch } from './schema-structure.js';

// ---------------------------------------------------------------------------
// findDiscriminatedUnionMatch
// ---------------------------------------------------------------------------

const optionA = z.object({ type: z.literal('a'), x: z.string() });
const optionB = z.object({ type: z.literal('b'), y: z.number() });
const options = [optionA, optionB] as z.ZodType[];

describe('findDiscriminatedUnionMatch', () => {
  it('returns the matching option for a known discriminator value', () => {
    expect(
      findDiscriminatedUnionMatch(options, 'type', { type: 'a', x: 'hello' }),
    ).toBe(optionA);
    expect(
      findDiscriminatedUnionMatch(options, 'type', { type: 'b', y: 42 }),
    ).toBe(optionB);
  });

  it('returns undefined when data is null, undefined, not an object, or missing the key', () => {
    expect(findDiscriminatedUnionMatch(options, 'type', null)).toBeUndefined();
    expect(
      findDiscriminatedUnionMatch(options, 'type', undefined),
    ).toBeUndefined();
    expect(
      findDiscriminatedUnionMatch(options, 'type', 'string'),
    ).toBeUndefined();
    expect(
      findDiscriminatedUnionMatch(options, 'type', { other: 'a' }),
    ).toBeUndefined();
  });

  it('returns undefined when discriminator value matches no option', () => {
    expect(
      findDiscriminatedUnionMatch(options, 'type', { type: 'c' }),
    ).toBeUndefined();
  });

  it('throws for invalid option schemas', () => {
    expect(() =>
      findDiscriminatedUnionMatch([z.string() as z.ZodType, optionB], 'type', {
        type: 'b',
      }),
    ).toThrow('discriminated union option must be an object schema');

    expect(() =>
      findDiscriminatedUnionMatch(
        [z.object({ type: z.string() }) as z.ZodType, optionB],
        'type',
        { type: 'b' },
      ),
    ).toThrow('discriminator field "type" must be a literal schema');
  });
});
