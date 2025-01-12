import { diffComm } from 'node-diff3';

import type { MergeResult } from './types.js';

interface CommonCommResult {
  common: string[];
}
interface DiffCommResult {
  buffer1: string[];
  buffer2: string[];
}
type CommResult = CommonCommResult | DiffCommResult;

/**
 * This algorithm just does a simple 2-way diff between the user's text and the baseplate's text
 * and returns the merged text without any base reference.
 *
 * @param userText User's text
 * @param newText Baseplate's text
 * @returns Merged text and a boolean indicating if there was a conflict
 */
export const simpleDiffAlgorithm = (
  userText: string,
  newText: string,
): MergeResult => {
  const patch: CommResult[] = diffComm(
    userText.split('\n'),
    newText.split('\n'),
  );

  const isCommonCommResult = (r: CommResult): r is CommonCommResult =>
    'common' in r;

  return {
    mergedText: patch
      .flatMap((result) => {
        if (isCommonCommResult(result)) {
          return result.common;
        }
        return [
          '<<<<<<< existing',
          ...result.buffer1,
          '=======',
          ...result.buffer2,
          '>>>>>>> baseplate',
        ];
      })
      .join('\n'),
    hasConflict: patch.some((result) => !isCommonCommResult(result)),
  };
};
