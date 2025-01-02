import jsonPatch from 'fast-json-patch';

import type { MergeAlgorithm } from './types.js';

/**
 * Merges JSON strings using a 3-way merge algorithm
 */
export const jsonMergeAlgorithm: MergeAlgorithm = async (
  userText,
  newText,
  baseText,
  options,
) => {
  try {
    const originalJson = JSON.parse(baseText) as Record<string, unknown>;
    const newJson = JSON.parse(newText) as Record<string, unknown>;
    const existingJson = JSON.parse(userText) as Record<string, unknown>;

    const diff = jsonPatch.compare(originalJson, newJson, true);

    if (diff.length === 0) {
      return {
        mergedText: userText,
        hasConflict: false,
      };
    }

    const result = JSON.stringify(
      jsonPatch.applyPatch(existingJson, diff, true, false).newDocument,
      null,
      2,
    );

    return {
      mergedText: await options.formatContents(result),
      hasConflict: false,
    };
  } catch {
    // default to merge strings method if patching fails
    return null;
  }
};
