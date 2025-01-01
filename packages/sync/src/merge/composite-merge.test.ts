import { describe, expect, it } from 'vitest';

import type { MergeAlgorithm, MergeOptions } from './types.js';

import { buildCompositeMergeAlgorithm } from './composite-merge.js';

const mergeOptions: MergeOptions = {
  formatContents: (contents) => contents,
};

describe('buildCompositeMergeAlgorithm', () => {
  it('should try algorithms in order until one succeeds', async () => {
    const algorithm1: MergeAlgorithm = () => null;
    const algorithm2: MergeAlgorithm = (userText, newText) => ({
      mergedText: userText + newText,
      hasConflict: false,
    });
    const algorithm3: MergeAlgorithm = () => ({
      mergedText: 'should not reach here',
      hasConflict: false,
    });

    const composite = buildCompositeMergeAlgorithm([
      algorithm1,
      algorithm2,
      algorithm3,
    ]);

    const result = await composite('user', 'new', 'base', mergeOptions);

    expect(result).toEqual({
      mergedText: 'usernew',
      hasConflict: false,
    });
  });

  it('should return null if no algorithms succeed', async () => {
    const algorithm1: MergeAlgorithm = () => null;
    const algorithm2: MergeAlgorithm = () => null;

    const composite = buildCompositeMergeAlgorithm([algorithm1, algorithm2]);

    const result = await composite('user', 'new', 'base', mergeOptions);

    expect(result).toBeNull();
  });

  it('should work with empty algorithm list', async () => {
    const composite = buildCompositeMergeAlgorithm([]);

    const result = await composite('user', 'new', 'base', mergeOptions);

    expect(result).toBeNull();
  });
});
