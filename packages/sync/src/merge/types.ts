export interface MergeOptions {
  // function to format the contents of the file
  formatContents: (contents: string) => Promise<string> | string;
}

export type MergeResult = {
  mergedText: string;
  hasConflict: boolean;
} | null;

/**
 * Merges the user's text with baseplate's text
 *
 * @param userText User's text
 * @param newText Baseplate's newly generated text
 * @param baseText Baseplate's original text
 * @returns Merged text and a boolean indicating if there was a conflict.
 *          If there was the algorithm could not merge the text, return null.
 */
export type MergeAlgorithm = (
  userText: string,
  newText: string,
  baseText: string | undefined,
  options: MergeOptions,
) => MergeResult | Promise<MergeResult>;
