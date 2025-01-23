import { merge } from 'node-diff3';

import type { StringMergeAlgorithm } from './types.js';

/**
 * This algorithm does a 3-way merge between the user's text, the baseplate's text, and the new text using
 * the `node-diff3` library.
 *
 * @param input - Input for the merge algorithm
 * @returns Merged text and a boolean indicating if there was a conflict
 */
export const diff3MergeAlgorithm: StringMergeAlgorithm = (input) => {
  const mergeResult = merge(
    input.previousWorkingText,
    input.previousGeneratedText,
    input.currentGeneratedText,
    {
      // monkey patching types of diff3 lib (https://github.com/bhousel/node-diff3/blob/main/index.mjs#L434)
      ...({
        label: { a: 'existing', b: 'baseplate' },
      } as Record<string, unknown>),
      stringSeparator: '\n',
    },
  );
  return {
    mergedText: mergeResult.result.join('\n'),
    hasConflict: mergeResult.conflict,
  };
};
