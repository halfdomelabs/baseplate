import { describe, expect, it } from 'vitest';

import { findDuplicates } from './find-duplicates.js';

describe('findDuplicates', () => {
  it('should find duplicates', () => {
    expect(findDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a']);
  });

  it('should return an empty array if there are no duplicates', () => {
    expect(findDuplicates(['a', 'b', 'c'])).toEqual([]);
  });
});
