import { describe, expect, it } from 'vitest';

import { safeMerge, safeMergeAll } from './safe-merge.js';

describe('safeMerge', () => {
  it('merges two objects with unique keys', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, d: 4 };

    const result = safeMerge(obj1, obj2);

    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it('throws an error when keys overlap', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };

    expect(() => safeMerge(obj1, obj2)).toThrowError(
      'Cannot merge key b because it already exists.',
    );
  });

  it('handles empty objects gracefully', () => {
    const obj1 = {};
    const obj2 = { a: 1 };

    const result = safeMerge(obj1, obj2);

    expect(result).toEqual({ a: 1 });
  });
});

describe('safeMergeAll', () => {
  it('merges an array of objects', () => {
    const items = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const result = safeMergeAll(items);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('throws an error when keys overlap', () => {
    const items = [{ a: 1 }, { b: 2 }, { b: 3 }];
    expect(() => safeMergeAll(items)).toThrowError(
      'Cannot merge key b because it already exists.',
    );
  });
});
