import { describe, expect, it } from 'vitest';

import { assertNoDuplicates } from './assert-no-duplicates.js';

describe('assertNoDuplicates', () => {
  it('should not throw for an empty array', () => {
    expect(() => {
      assertNoDuplicates([], 'items');
    }).not.toThrow();
  });

  it('should use identity when keyFn is omitted', () => {
    const items = ['a', 'b', 'a'];
    expect(() => {
      assertNoDuplicates(items, 'strings');
    }).toThrow('Duplicate strings found: "a"');
  });

  it('should not throw with unique values and no keyFn', () => {
    const items = ['a', 'b', 'c'];
    expect(() => {
      assertNoDuplicates(items, 'strings');
    }).not.toThrow();
  });

  it('should not throw for an array with unique string keys', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(() => {
      assertNoDuplicates(items, 'items', (item) => item.id);
    }).not.toThrow();
  });

  it('should throw for an array with duplicate string keys', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'a' }];
    expect(() => {
      assertNoDuplicates(items, 'items', (item) => item.id);
    }).toThrow('Duplicate items found: "a"');
  });

  it('should list all duplicate keys in the error message', () => {
    const items = [
      { id: 'a' },
      { id: 'b' },
      { id: 'a' },
      { id: 'c' },
      { id: 'b' },
      { id: 'a' },
    ];
    expect(() => {
      assertNoDuplicates(items, 'route loader fields', (item) => item.id);
    }).toThrow('Duplicate route loader fields found: "a", "b"');
  });

  it('should work with number keys', () => {
    const items = [1, 2, 3, 2, 4];
    expect(() => {
      assertNoDuplicates(items, 'numbers');
    }).toThrow('Duplicate numbers found: 2');
  });

  it('should work with object identity via key function', () => {
    const items = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Alice', age: 35 },
    ];
    expect(() => {
      assertNoDuplicates(items, 'user names', (item) => item.name);
    }).toThrow('Duplicate user names found: "Alice"');
  });

  it('should not throw when all keys are unique with complex objects', () => {
    const items = [
      { key: 'route1', value: 'a' },
      { key: 'route2', value: 'b' },
      { key: 'route3', value: 'c' },
    ];
    expect(() => {
      assertNoDuplicates(items, 'routes', (item) => item.key);
    }).not.toThrow();
  });
});
