import { diffComm } from 'node-diff3';

import type { StringMergeResult } from './types.js';

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
 * @param input - Input for the merge algorithm
 * @returns Merged text and a boolean indicating if there was a conflict
 */
export const simpleDiffAlgorithm = ({
  previousWorkingText,
  currentGeneratedText,
}: {
  previousWorkingText: string;
  currentGeneratedText: string;
}): StringMergeResult => {
  const patch: CommResult[] = diffComm(
    previousWorkingText.split('\n'),
    currentGeneratedText.split('\n'),
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
