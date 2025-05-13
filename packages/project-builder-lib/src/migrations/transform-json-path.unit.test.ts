import { describe, expect, it } from 'vitest';

import {
  renameObjectKeysTransform,
  transformJsonPath,
} from './transform-json-path.js';

describe('transformJsonPath', () => {
  it('should transform a value at a simple path', () => {
    const data = { a: { b: 10 } };
    const result = transformJsonPath(
      data,
      'a.b',
      (value) => (value as number) * 2,
    );
    expect(result).toEqual({ a: { b: 20 } });
  });

  it('should transform a value with a nested path', () => {
    const data = { a: { b: { c: 5 } } };
    const result = transformJsonPath(
      data,
      'a.b.c',
      (value) => (value as number) + 3,
    );
    expect(result).toEqual({ a: { b: { c: 8 } } });
  });

  it('should transform all elements in an array with a wildcard', () => {
    const data = { items: [1, 2, 3] };
    const result = transformJsonPath(
      data,
      'items.*',
      (value) => (value as number) * 2,
    );
    expect(result).toEqual({ items: [2, 4, 6] });
  });

  it('should handle nested arrays with a wildcard', () => {
    const data = { items: [{ value: 1 }, { value: 2 }, { value: 3 }] };
    const result = transformJsonPath(
      data,
      'items.*.value',
      (value) => (value as number) + 1,
    );
    expect(result).toEqual({
      items: [{ value: 2 }, { value: 3 }, { value: 4 }],
    });
  });

  it('should transform all elements in an object with a double wildcard', () => {
    const data = { items: { a: 1, b: 2, c: 3 } };
    const result = transformJsonPath(
      data,
      'items.**',
      (value) => (value as number) * 2,
    );
    expect(result).toEqual({ items: { a: 2, b: 4, c: 6 } });
  });

  it('should return the same object if the path does not exist', () => {
    const data = { a: { b: 10 } };
    const result = transformJsonPath(data, 'a.c', (value) => value);
    expect(result).toEqual(data);
  });

  it('should throw an error if wildcard is applied to non-array', () => {
    const data = { items: 10 };
    expect(() => {
      transformJsonPath(data, 'items.*', (value) => value);
    }).toThrow(TypeError);
  });

  it('should throw an error if path part is not an object at runtime', () => {
    const data = { a: { b: 10 } };
    expect(() => {
      transformJsonPath(data, 'a.b.c', (value) => value);
    }).toThrow(TypeError);
  });

  it('should handle complex nested structures with wildcards', () => {
    const data = {
      groups: [
        { users: [{ age: 20 }, { age: 25 }] },
        { users: [{ age: 30 }, { age: 35 }] },
      ],
    };
    const result = transformJsonPath(
      data,
      'groups.*.users.*.age',
      (age) => (age as number) + 5,
    );
    expect(result).toEqual({
      groups: [
        { users: [{ age: 25 }, { age: 30 }] },
        { users: [{ age: 35 }, { age: 40 }] },
      ],
    });
  });

  it('should clone deep the transformed value', () => {
    const data = { a: { b: { c: [1, 2, 3] } } };
    const result = transformJsonPath(data, 'a.b.c', (value) => {
      (value as number[]).push(4);
      return value;
    });
    expect(result).toEqual({ a: { b: { c: [1, 2, 3, 4] } } });
    expect(data.a.b.c).toEqual([1, 2, 3]); // Original object is unchanged
  });
});

describe('renameObjectKeysTransform', () => {
  it('should rename multiple keys in an object', () => {
    const data = {
      oldKey1: 'value1',
      oldKey2: 'value2',
      unchangedKey: 'value3',
    };
    const result = renameObjectKeysTransform({
      oldKey1: 'newKey1',
      oldKey2: 'newKey2',
    })(data);
    expect(result).toEqual({
      newKey1: 'value1',
      newKey2: 'value2',
      unchangedKey: 'value3',
    });
  });

  it('should return null if input is null', () => {
    const result = renameObjectKeysTransform({
      oldKey: 'newKey',
    })(null);
    expect(result).toBeNull();
  });

  it('should throw error if input is not an object', () => {
    expect(() => {
      renameObjectKeysTransform({
        oldKey: 'newKey',
      })(42);
    }).toThrow(TypeError);
  });

  it('should keep keys unchanged if they are not in rename map', () => {
    const data = {
      key1: 'value1',
      key2: 'value2',
    };
    const result = renameObjectKeysTransform({
      nonexistentKey: 'newKey',
    })(data);
    expect(result).toEqual(data);
  });

  it('should handle empty rename map', () => {
    const data = {
      key1: 'value1',
      key2: 'value2',
    };
    const result = renameObjectKeysTransform({})(data);
    expect(result).toEqual(data);
  });
});
