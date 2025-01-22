import jsonPatch from 'fast-json-patch';

import type { StringMergeAlgorithm } from './types.js';

/**
 * Merges JSON strings using a 3-way merge algorithm
 */
export const jsonMergeAlgorithm: StringMergeAlgorithm = (input) => {
  try {
    const originalJson = JSON.parse(input.previousGeneratedText) as Record<
      string,
      unknown
    >;
    const newJson = JSON.parse(input.currentGeneratedText) as Record<
      string,
      unknown
    >;
    const existingJson = JSON.parse(input.previousWorkingText) as Record<
      string,
      unknown
    >;

    const diff = jsonPatch.compare(originalJson, newJson, true);

    if (diff.length === 0) {
      return {
        mergedText: input.previousWorkingText,
        hasConflict: false,
      };
    }

    const result = JSON.stringify(
      jsonPatch.applyPatch(existingJson, diff, true, false).newDocument,
      null,
      2,
    );

    return {
      mergedText: result,
      hasConflict: false,
    };
  } catch {
    // default to merge strings method if patching fails
    return null;
  }
};
