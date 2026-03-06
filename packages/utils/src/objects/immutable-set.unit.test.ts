import { describe, expect, it } from 'vitest';

import { immutableSet } from './immutable-set.js';

describe('immutableSet', () => {
  it('should set a value at a top-level property of an object', () => {
    const obj = { a: 1, b: 2 };
    const result = immutableSet(obj, ['a'], 3);
    expect(result).toEqual({ a: 3, b: 2 });
    expect(result).not.toBe(obj);
  });

  it('should set a value at a nested property of an object', () => {
    const obj = { a: { b: 1 }, c: 2 };
    const result = immutableSet<{ a: { b: number }; c: number }>(
      obj,
      ['a', 'b'],
      3,
    );
    expect(result).toEqual({ a: { b: 3 }, c: 2 });
    expect(result).not.toBe(obj);
    expect(result.a).not.toBe(obj.a);
    expect(result.c).toBe(obj.c); // Structural sharing
  });

  it('should set a value at an array index', () => {
    const arr = [1, 2, 3];
    const result = immutableSet(arr, [1], 4);
    expect(result).toEqual([1, 4, 3]);
    expect(result).not.toBe(arr);
  });

  it('should set a value at a nested array index', () => {
    const obj = { a: [1, { b: 2 }, 3] };
    const result = immutableSet<{ a: unknown[] }>(obj, ['a', 1, 'b'], 4);
    expect(result).toEqual({ a: [1, { b: 4 }, 3] });
    expect(result.a[1]).not.toBe(obj.a[1]);
    expect(result.a[0]).toBe(obj.a[0]);
  });

  it('should return the value if the path is empty', () => {
    const obj = { a: 1 };
    const result = immutableSet(obj, [], { b: 2 });
    expect(result).toEqual({ b: 2 });
  });

  it('should throw if the path is invalid (traversing a primitive)', () => {
    const obj = { a: 1 };
    expect(() => immutableSet(obj, ['a', 'b'], 2)).toThrow(
      'Invalid path: cannot set property "b" on non-object value',
    );
  });

  it('should throw if the path is invalid (traversing null)', () => {
    const obj = { a: null };
    expect(() => immutableSet(obj, ['a', 'b'], 2)).toThrow(
      'Invalid path: cannot set property "b" on non-object value',
    );
  });

  it('should throw if using a string key for an array', () => {
    const arr = [1, 2, 3];
    expect(() => immutableSet(arr, ['a'], 4)).toThrow(
      'Invalid path: expected number index for array, got "a"',
    );
  });

  it('should support adding new properties to an object', () => {
    const obj = { a: 1 };
    const result = immutableSet(obj, ['b'], 2);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should support adding new elements to an array by index', () => {
    const arr = [1];
    const result = immutableSet(arr, [2], 3);
    // [1, undefined, 3]
    expect(result).toEqual([1, undefined, 3]);
  });
});
