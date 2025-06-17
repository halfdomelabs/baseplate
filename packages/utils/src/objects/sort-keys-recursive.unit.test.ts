import { describe, expect, it } from 'vitest';

import { sortKeysRecursive } from './sort-keys-recursive.js';

describe('sortKeysRecursive', () => {
  it('sorts keys in a flat object', () => {
    const input = { zebra: 1, apple: 2, banana: 3 };
    const result = sortKeysRecursive(input);

    expect(JSON.stringify(result)).toBe('{"apple":2,"banana":3,"zebra":1}');
  });

  it('sorts keys in nested objects', () => {
    const input = {
      c: { z: 3, y: 2, x: 1 },
      a: { c: 3, b: 2, a: 1 },
      b: { f: 3, e: 2, d: 1 },
    };
    const result = sortKeysRecursive(input);

    expect(JSON.stringify(result)).toBe(
      '{"a":{"a":1,"b":2,"c":3},"b":{"d":1,"e":2,"f":3},"c":{"x":1,"y":2,"z":3}}',
    );
  });

  it('handles arrays of objects', () => {
    const input = [
      { c: 3, a: 1, b: 2 },
      { f: 6, d: 4, e: 5 },
    ];
    const result = sortKeysRecursive(input);

    expect(JSON.stringify(result)).toBe(
      '[{"a":1,"b":2,"c":3},{"d":4,"e":5,"f":6}]',
    );
  });

  it('handles mixed nested structures', () => {
    const input = {
      c: [{ z: 3, y: 2, x: 1 }],
      a: { c: 3, b: 2, a: 1 },
      b: [{ f: 3, e: 2, d: 1 }],
    };
    const result = sortKeysRecursive(input);

    expect(JSON.stringify(result)).toBe(
      '{"a":{"a":1,"b":2,"c":3},"b":[{"d":1,"e":2,"f":3}],"c":[{"x":1,"y":2,"z":3}]}',
    );
  });

  it('preserves non-object values', () => {
    const input = {
      c: 'string',
      a: 123,
      b: true,
      d: null,
    };
    const result = sortKeysRecursive(input);

    expect(JSON.stringify(result)).toBe(
      '{"a":123,"b":true,"c":"string","d":null}',
    );
  });
});
