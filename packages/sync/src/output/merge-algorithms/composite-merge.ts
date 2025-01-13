import type { MergeAlgorithm } from './types.js';

export function buildCompositeMergeAlgorithm(
  mergeAlgorithms: MergeAlgorithm[],
): MergeAlgorithm {
  return async (userText, newText, baseText, context) => {
    // try merge algorithms in order until one works
    for (const algorithm of mergeAlgorithms) {
      const result = await algorithm(userText, newText, baseText, context);
      if (result) {
        return result;
      }
    }
    return null;
  };
}
