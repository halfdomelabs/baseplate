import { describe, expect, it } from 'vitest';

import { compareStrings } from './compare-strings.js';

describe('compareStrings', () => {
  it('should return negative when first string is less than second', () => {
    expect(compareStrings('apple', 'banana')).toBeLessThan(0);
  });

  it('should return positive when first string is greater than second', () => {
    expect(compareStrings('banana', 'apple')).toBeGreaterThan(0);
  });

  it('should return zero when strings are equal', () => {
    expect(compareStrings('apple', 'apple')).toBe(0);
  });

  it('should sort strings correctly', () => {
    const items = ['cherry', 'apple', 'banana'];
    items.sort(compareStrings);
    expect(items).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should be case-sensitive', () => {
    const items = ['apple', 'Banana', 'cherry'];
    items.sort(compareStrings);
    // Capital letters come before lowercase in ASCII
    expect(items).toEqual(['Banana', 'apple', 'cherry']);
  });

  it('should handle empty strings', () => {
    expect(compareStrings('', 'a')).toBeLessThan(0);
    expect(compareStrings('a', '')).toBeGreaterThan(0);
    expect(compareStrings('', '')).toBe(0);
  });

  it('should provide stable sort results', () => {
    const items1 = ['zebra', 'apple', 'mango', 'banana'];
    const items2 = ['zebra', 'apple', 'mango', 'banana'];

    items1.sort(compareStrings);
    items2.sort(compareStrings);

    expect(items1).toEqual(items2);
    expect(items1).toEqual(['apple', 'banana', 'mango', 'zebra']);
  });
});
