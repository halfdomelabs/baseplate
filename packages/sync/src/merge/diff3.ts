import { merge } from 'node-diff3';

import type { MergeAlgorithm } from './types.js';

/**
 * This algorithm does a 3-way merge between the user's text, the baseplate's text, and the new text using
 * the `node-diff3` library.
 *
 * @param userText User's text
 * @param newText Baseplate's text
 * @param baseText Baseplate's text
 * @returns Merged text and a boolean indicating if there was a conflict
 */
export const diff3MergeAlgorithm: MergeAlgorithm = (
  userText,
  newText,
  baseText,
) => {
  if (!baseText) {
    return null;
  }
  const mergeResult = merge(userText, baseText, newText, {
    // monkey patching types of diff3 lib (https://github.com/bhousel/node-diff3/blob/main/index.mjs#L434)
    ...({
      label: { a: 'existing', b: 'baseplate' },
    } as Record<string, unknown>),
    stringSeparator: '\n',
  });
  return {
    mergedText: mergeResult.result.join('\n'),
    hasConflict: mergeResult.conflict,
  };
};
