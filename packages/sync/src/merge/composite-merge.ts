import type { MergeAlgorithm } from './types.js';

export function buildCompositeMergeAlgorithm(
  mergeAlgorithms: MergeAlgorithm[],
): MergeAlgorithm {
  return async (userText, newText, baseText, options) => {
    // try merge algorithms in order until one works
    for (const algorithm of mergeAlgorithms) {
      const result = await algorithm(userText, newText, baseText, options);
      if (result) {
        return result;
      }
    }
    return null;
  };
}
