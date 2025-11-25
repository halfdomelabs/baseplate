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

  it('should sort case-insensitively with case-sensitive tiebreaker', () => {
    const items = ['apple', 'Banana', 'cherry'];
    items.sort(compareStrings);
    // Case-insensitive primary sort, case-sensitive tiebreaker
    expect(items).toEqual(['apple', 'Banana', 'cherry']);
  });

  it('should use case-sensitive tiebreaker for same-letter-different-case strings', () => {
    const items = ['Cherry', 'cherry', 'CHERRY'];
    items.sort(compareStrings);
    // Uppercase comes before lowercase in ASCII tiebreaker
    expect(items).toEqual(['CHERRY', 'Cherry', 'cherry']);
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

  it('should sort mixed case strings case-insensitively', () => {
    const items = ['Banana', 'apple', 'Cherry', 'cherry'];
    items.sort(compareStrings);
    expect(items).toEqual(['apple', 'Banana', 'Cherry', 'cherry']);
  });

  it('should compare case-insensitively for different strings', () => {
    expect(compareStrings('Apple', 'banana')).toBeLessThan(0);
    expect(compareStrings('apple', 'BANANA')).toBeLessThan(0);
    expect(compareStrings('Banana', 'apple')).toBeGreaterThan(0);
    expect(compareStrings('BANANA', 'apple')).toBeGreaterThan(0);
  });
});
