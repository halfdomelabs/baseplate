import { describe, expect, it } from 'vitest';

import { jsonDeepClone } from './json-deep-clone.js';

describe('jsonDeepClone', () => {
  describe('primitive values', () => {
    it('should clone null', () => {
      const result = jsonDeepClone(null);
      expect(result).toBe(null);
    });

    it('should clone undefined', () => {
      const input = undefined;
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- generic returning undefined
      const result = jsonDeepClone(input);
      expect(result).toBe(undefined);
    });

    it('should clone boolean values', () => {
      expect(jsonDeepClone(true)).toBe(true);
      expect(jsonDeepClone(false)).toBe(false);
    });

    it('should clone string values', () => {
      const original = 'test string';
      const result = jsonDeepClone(original);
      expect(result).toBe(original);
    });

    it('should clone number values', () => {
      expect(jsonDeepClone(42)).toBe(42);
      expect(jsonDeepClone(3.14)).toBe(3.14);
      expect(jsonDeepClone(0)).toBe(0);
      expect(jsonDeepClone(-1)).toBe(-1);
    });
  });

  describe('arrays', () => {
    it('should clone simple arrays', () => {
      const original = [1, 2, 3];
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });

    it('should clone nested arrays', () => {
      const original = [
        [1, 2],
        [3, 4],
      ];
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result[0]).not.toBe(original[0]);
      expect(result[1]).not.toBe(original[1]);
    });

    it('should clone arrays with mixed types', () => {
      const original = [1, 'string', true, null, [1, 2]];
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result[4]).not.toBe(original[4]);
    });

    it('should clone empty arrays', () => {
      const original: unknown[] = [];
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });
  });

  describe('objects', () => {
    it('should clone simple objects', () => {
      const original = { a: 1, b: 'test' };
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = { a: { b: 1, c: 2 }, d: 3 };
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result.a).not.toBe(original.a);
    });

    it('should clone objects with arrays', () => {
      const original = { items: [1, 2, 3], count: 3 };
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result.items).not.toBe(original.items);
    });

    it('should clone empty objects', () => {
      const original = {};
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });

    it('should handle objects with null values', () => {
      const original = { a: null, b: 1 };
      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
    });
  });

  describe('complex nested structures', () => {
    it('should clone deeply nested structures', () => {
      const original = {
        users: [
          { id: 1, profile: { name: 'Alice', settings: { theme: 'dark' } } },
          { id: 2, profile: { name: 'Bob', settings: { theme: 'light' } } },
        ],
        metadata: {
          count: 2,
          tags: ['user', 'profile'],
        },
      };

      const result = jsonDeepClone(original);

      expect(result).toEqual(original);
      expect(result).not.toBe(original);
      expect(result.users).not.toBe(original.users);
      expect(result.users[0]).not.toBe(original.users[0]);
      expect(result.users[0].profile).not.toBe(original.users[0].profile);
      expect(result.users[0].profile.settings).not.toBe(
        original.users[0].profile.settings,
      );
      expect(result.metadata).not.toBe(original.metadata);
      expect(result.metadata.tags).not.toBe(original.metadata.tags);
    });
  });

  describe('error cases', () => {
    it('should throw error for functions', () => {
      const fn = (): void => {
        // Empty function for testing
      };
      expect(() => jsonDeepClone(fn)).toThrow(
        'Cannot clone value of unsupported type: function',
      );
    });

    it('should throw error for symbols', () => {
      const sym = Symbol('test');
      expect(() => jsonDeepClone(sym)).toThrow(
        'Cannot clone value of unsupported type: symbol',
      );
    });

    it('should throw error for BigInt', () => {
      const bigInt = BigInt(123);
      expect(() => jsonDeepClone(bigInt)).toThrow(
        'Cannot clone value of unsupported type: bigint',
      );
    });

    it('should throw error for Date objects', () => {
      const date = new Date();
      expect(() => jsonDeepClone(date)).toThrow(
        'Cannot clone value of unsupported type: Date',
      );
    });

    it('should throw error for RegExp objects', () => {
      const regex = /test/;
      expect(() => jsonDeepClone(regex)).toThrow(
        'Cannot clone value of unsupported type: RegExp',
      );
    });
  });
});
