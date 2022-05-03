import { merge, diffComm } from 'node-diff3';

type CommonCommResult = { common: string[] };
type DiffCommResult = { buffer1: string[]; buffer2: string[] };
type CommResult = CommonCommResult | DiffCommResult;

/**
 * Performs 2-way or 3-way merge between 3 strings
 *
 * @param existingContents Existing content currently in codebase
 * @param newContents New generated contents
 * @param originalContents Original generated contents
 * @returns Merged version
 */
export function mergeStrings(
  existingContents: string,
  newContents: string,
  originalContents?: string
): { contents: string; hasConflict: boolean } {
  // if nothing has changed, just return the original
  if (originalContents === newContents) {
    return { contents: newContents, hasConflict: false };
  }

  // apply 3-way merge
  if (originalContents) {
    const mergeResult = merge(existingContents, originalContents, newContents, {
      // monkey patching types of diff3 lib (https://github.com/bhousel/node-diff3/blob/main/index.mjs#L434)
      ...({
        label: { a: 'existing', b: 'baseplate' },
      } as Record<string, unknown>),
      stringSeparator: '\n',
    });
    return {
      contents: mergeResult.result.join('\n'),
      hasConflict: mergeResult.conflict,
    };
  }
  const patch: CommResult[] = diffComm(
    existingContents.split('\n'),
    newContents.split('\n')
  );

  const isCommonCommResult = (r: CommResult): r is CommonCommResult =>
    (r as CommonCommResult).common !== undefined;

  return {
    contents: patch
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
    hasConflict: true,
  };
}
