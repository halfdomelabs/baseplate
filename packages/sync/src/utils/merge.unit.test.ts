import { describe, expect, it } from 'vitest';

import { safeMergeMap } from './merge.js';

describe('safeMergeMap', () => {
  it('should merge multiple Maps without duplicates', () => {
    const map1 = new Map([['a', 1]]);
    const map2 = new Map([['b', 2]]);
    const result = safeMergeMap(map1, map2);

    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    );
  });

  it('should merge a Map and an array of entries without duplicates', () => {
    const map = new Map([['a', 1]]);
    const entries: [string, number][] = [
      ['b', 2],
      ['c', 3],
    ];
    const result = safeMergeMap(map, entries);

    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
    );
  });

  it('should throw an error if there are duplicate keys', () => {
    const map1 = new Map([['a', 1]]);
    const map2 = new Map([['a', 2]]);

    expect(() => safeMergeMap(map1, map2)).toThrowError(
      'Duplicate key found during merge: a',
    );
  });

  it('should handle merging multiple arrays of entries', () => {
    const entries1: [string, number][] = [['a', 1]];
    const entries2: [string, number][] = [['b', 2]];
    const result = safeMergeMap(entries1, entries2);

    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    );
  });

  it('should return an empty Map when no arguments are provided', () => {
    const result = safeMergeMap();

    expect(result.size).toBe(0);
  });
});
