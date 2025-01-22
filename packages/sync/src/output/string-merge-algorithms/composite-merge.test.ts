import { describe, expect, it } from 'vitest';

import type { StringMergeAlgorithm } from './types.js';

import { buildCompositeMergeAlgorithm } from './composite-merge.js';

describe('buildCompositeMergeAlgorithm', () => {
  it('should try algorithms in order until one succeeds', async () => {
    const algorithm1: StringMergeAlgorithm = () => null;
    const algorithm2: StringMergeAlgorithm = (input) => ({
      mergedText: input.previousWorkingText + input.currentGeneratedText,
      hasConflict: false,
    });
    const algorithm3: StringMergeAlgorithm = () => ({
      mergedText: 'should not reach here',
      hasConflict: false,
    });

    const composite = buildCompositeMergeAlgorithm([
      algorithm1,
      algorithm2,
      algorithm3,
    ]);

    const result = await composite({
      previousWorkingText: 'user',
      currentGeneratedText: 'new',
      previousGeneratedText: 'base',
    });

    expect(result).toEqual({
      mergedText: 'usernew',
      hasConflict: false,
    });
  });

  it('should return null if no algorithms succeed', async () => {
    const algorithm1: StringMergeAlgorithm = () => null;
    const algorithm2: StringMergeAlgorithm = () => null;

    const composite = buildCompositeMergeAlgorithm([algorithm1, algorithm2]);

    const result = await composite({
      previousWorkingText: 'user',
      currentGeneratedText: 'new',
      previousGeneratedText: 'base',
    });

    expect(result).toBeNull();
  });

  it('should work with empty algorithm list', async () => {
    const composite = buildCompositeMergeAlgorithm([]);

    const result = await composite({
      previousWorkingText: 'user',
      currentGeneratedText: 'new',
      previousGeneratedText: 'base',
    });

    expect(result).toBeNull();
  });
});
