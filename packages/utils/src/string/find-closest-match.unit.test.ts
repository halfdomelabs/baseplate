import { describe, expect, it } from 'vitest';

import { findClosestMatch } from './find-closest-match.js';

describe('findClosestMatch', () => {
  it('should return the closest match when n=1', () => {
    const candidates = ['apple', 'banana', 'orange', 'grape'];
    const result = findClosestMatch('aple', candidates);

    expect(result).toEqual(['apple']);
  });

  it('should return the n closest matches', () => {
    const candidates = ['apple', 'banana', 'orange', 'grape'];
    const result = findClosestMatch('aple', candidates, 2);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe('apple'); // closest match
  });

  it('should return empty array when candidates is empty', () => {
    const result = findClosestMatch('test', []);

    expect(result).toEqual([]);
  });

  it('should return empty array when n is 0', () => {
    const candidates = ['apple', 'banana'];
    const result = findClosestMatch('test', candidates, 0);

    expect(result).toEqual([]);
  });

  it('should return empty array when n is negative', () => {
    const candidates = ['apple', 'banana'];
    const result = findClosestMatch('test', candidates, -1);

    expect(result).toEqual([]);
  });

  it('should return all candidates when n is greater than candidates length', () => {
    const candidates = ['apple', 'banana'];
    const result = findClosestMatch('test', candidates, 5);

    expect(result).toEqual(['apple', 'banana']);
  });

  it('should handle exact matches', () => {
    const candidates = ['apple', 'banana', 'orange'];
    const result = findClosestMatch('apple', candidates, 1);

    expect(result).toEqual(['apple']);
  });

  it('should maintain stable sorting for equal distances', () => {
    const candidates = ['cat', 'bat', 'hat'];
    const result = findClosestMatch('at', candidates, 3);

    // All have distance 1, should maintain original order
    expect(result).toEqual(['cat', 'bat', 'hat']);
  });

  it('should handle single character differences', () => {
    const candidates = ['hello', 'hallo', 'hullo'];
    const result = findClosestMatch('hello', candidates, 2);

    expect(result[0]).toBe('hello'); // exact match
    expect(result[1]).toBe('hallo'); // 1 character difference
  });
});
