import { parse } from 'yaml';
import { yamlDiffPatch } from 'yaml-diff-patch';

import type { StringMergeAlgorithm } from './types.js';

/**
 * Merges YAML strings using a 3-way merge algorithm
 */
export const yamlMergeAlgorithm: StringMergeAlgorithm = (input) => {
  try {
    // Parse YAML strings to JSON objects
    const originalJson = parse(input.previousGeneratedText) as unknown;
    const newJson = parse(input.currentGeneratedText) as unknown;
    const existingYaml = input.previousWorkingText;

    // Use yamlDiffPatch to apply the JSON diff as a patch to the YAML
    // This preserves whitespace, comments, and structure
    const result = yamlDiffPatch(existingYaml, originalJson, newJson);

    return {
      mergedText: result,
      hasConflict: false,
    };
  } catch {
    // default to merge strings method if patching fails
    return null;
  }
};
