import type { StringMergeAlgorithm } from './types.js';

export function buildCompositeMergeAlgorithm(
  mergeAlgorithms: StringMergeAlgorithm[],
): StringMergeAlgorithm {
  return async (input) => {
    // try merge algorithms in order until one works
    for (const algorithm of mergeAlgorithms) {
      const result = await algorithm(input);
      if (result) {
        return result;
      }
    }
    return null;
  };
}
