/**
 * Result of the merge algorithm
 */
export type StringMergeResult = {
  /**
   * The merged text of the file
   */
  mergedText: string;

  /**
   * Whether there was a conflict during the merge
   */
  hasConflict: boolean;
} | null;

/**
 * Options for the merge algorithm
 */
export interface StringMergeAlgorithmInput {
  /**
   * The previous working text of the file
   */
  previousWorkingText: string;

  /**
   * The current generated text of the file
   */
  currentGeneratedText: string;

  /**
   * The previous generated text of the file
   */
  previousGeneratedText: string;
}

/**
 * Merges the working file's text with generated file's text
 *
 * @param options - Options for the merge algorithm
 * @returns Merged text and a boolean indicating if there was a conflict.
 *          If there was the algorithm could not merge the text, return null.
 */
export type StringMergeAlgorithm = (
  input: StringMergeAlgorithmInput,
) => StringMergeResult | Promise<StringMergeResult>;
