import { describe, expect, it } from 'vitest';

import { stringifyPrettyCompact } from './stringify-pretty-compact.js';

describe('stringifyPrettyCompact', () => {
  it('should handle simple objects', () => {
    const obj = { a: 1, b: 2 };
    expect(stringifyPrettyCompact(obj)).toBe(`{ "a": 1, "b": 2 }`);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(stringifyPrettyCompact(arr)).toBe(`[1, 2, 3]`);
  });

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    expect(stringifyPrettyCompact(obj)).toBe(`{ "a": { "b": { "c": 1 } } }`);
  });

  it('should handle mixed arrays and objects', () => {
    const obj = { a: [1, { b: 2 }] };
    expect(stringifyPrettyCompact(obj)).toBe(`{ "a": [1, { "b": 2 }] }`);
  });

  it('should respect objectMargins false option', () => {
    const obj = { a: 1 };
    expect(stringifyPrettyCompact(obj, { objectMargins: false })).toBe(
      `{"a": 1}`,
    );
  });

  it('should respect arrayMargins option', () => {
    const arr = [1, 2, 3];
    expect(stringifyPrettyCompact(arr, { arrayMargins: true })).toBe(
      `[ 1, 2, 3 ]`,
    );
  });

  it('should respect custom indent', () => {
    const obj = { a: 1, b: 2 };
    expect(stringifyPrettyCompact(obj, { indent: 4, maxLength: 10 })).toBe(
      `
{
    "a": 1,
    "b": 2
}`.trim(),
    );
  });

  it('should handle maxLength option', () => {
    const obj = { a: 1, b: 2 };
    expect(stringifyPrettyCompact(obj, { maxLength: 10 })).toBe(
      `{
  "a": 1,
  "b": 2
}`,
    );
  });

  it('should handle toJSON method on objects', () => {
    const obj = {
      a: 1,
      toJSON() {
        return { b: 2 };
      },
    };
    expect(stringifyPrettyCompact(obj)).toBe(`{ "b": 2 }`);
  });

  it('should handle null and undefined values', () => {
    const obj = { a: null, b: undefined };
    expect(stringifyPrettyCompact(obj)).toBe(`{ "a": null }`);
  });

  it('should handle empty objects and arrays', () => {
    expect(stringifyPrettyCompact({})).toBe(`{}`);
    expect(stringifyPrettyCompact([])).toBe(`[]`);
  });

  it('should handle a complex object such that no line is greater than 80 characters', () => {
    const largeObj = {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        preferences: {
          theme: i % 2 ? 'dark' : 'light',
          notifications: {
            email: true,
            push: i % 3 === 0,
          },
        },
        history: Array.from({ length: 10 }, (_, j) => ({
          timestamp: Date.now() - j * 1000,
          action: `action_${j}`,
        })),
      })),
      metadata: {
        version: '1.0.0',
        timestamp: Date.now(),
        config: {
          features: ['feature1', 'feature2', 'feature3'],
          settings: {
            maxItems: 1000,
            timeout: 5000,
          },
        },
      },
    };

    const result = stringifyPrettyCompact(largeObj, {
      maxLength: 80,
    });

    const maxLineLength = Math.max(
      ...result.split('\n').map((line) => line.length),
      0,
    );

    expect(maxLineLength).toBeLessThanOrEqual(80);
    expect(JSON.parse(result)).toEqual(largeObj);
  });
});
