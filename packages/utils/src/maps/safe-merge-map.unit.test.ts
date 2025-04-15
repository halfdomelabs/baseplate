import { describe, expect, it } from 'vitest';

import { safeMergeMap, safeMergeMaps } from './safe-merge-map.js';

describe('safeMergeMap', () => {
  it('merges two maps with unique keys', () => {
    const map1 = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const map2 = new Map([
      ['c', 3],
      ['d', 4],
    ]);

    const result = safeMergeMap(map1, map2);

    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
        ['d', 4],
      ]),
    );
  });

  it('throws an error when keys overlap', () => {
    const map1 = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const map2 = new Map([
      ['b', 3],
      ['c', 4],
    ]);

    expect(() => safeMergeMap(map1, map2)).toThrowError(
      'Cannot merge key b because it already exists.',
    );
  });

  it('handles empty maps gracefully', () => {
    const map1 = new Map();
    const map2 = new Map([['a', 1]]);

    const result = safeMergeMap(map1, map2);

    expect(result).toEqual(new Map([['a', 1]]));
  });

  it('allows merging equal values when allowEqualValues is true', () => {
    const map1 = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const map2 = new Map([
      ['b', 2],
      ['c', 3],
    ]);

    const result = safeMergeMap(map1, map2, { allowEqualValues: true });

    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
    );
  });
});

describe('safeMergeMaps', () => {
  it('merges an array of maps', () => {
    const maps = [
      new Map([['a', 1]]),
      new Map([['b', 2]]),
      new Map([['c', 3]]),
    ];
    const result = safeMergeMaps(...maps);
    expect(result).toEqual(
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
    );
  });

  it('throws an error when keys overlap', () => {
    const maps = [
      new Map([['a', 1]]),
      new Map([['b', 2]]),
      new Map([['b', 3]]),
    ];
    expect(() => safeMergeMaps(...maps)).toThrowError(
      'Cannot merge key b because it already exists.',
    );
  });
});
