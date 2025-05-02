import { describe, expect, it } from 'vitest';

import { sortObjectKeys } from './sort-object-keys.js';

describe('sortObjectKeys', () => {
  it('sorts object keys alphabetically', () => {
    const input = { zebra: 1, apple: 2, banana: 3 };
    const result = sortObjectKeys(input);

    expect(JSON.stringify(result)).toBe('{"apple":2,"banana":3,"zebra":1}');
  });

  it('preserves the original values while sorting keys', () => {
    const input = { c: 'third', a: 'first', b: 'second' };
    const result = sortObjectKeys(input);

    expect(JSON.stringify(result)).toBe(
      '{"a":"first","b":"second","c":"third"}',
    );
  });

  it('handles empty objects', () => {
    const input = {};
    const result = sortObjectKeys(input);

    expect(JSON.stringify(result)).toBe('{}');
  });

  it('handles objects with numeric keys', () => {
    const input = { '2': 'two', '1': 'one', '3': 'three' };
    const result = sortObjectKeys(input);

    expect(JSON.stringify(result)).toBe('{"1":"one","2":"two","3":"three"}');
  });
});
