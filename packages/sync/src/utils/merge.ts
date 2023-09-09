import jsonPatch from 'fast-json-patch';
import { merge, diffComm } from 'node-diff3';

interface CommonCommResult { common: string[] }
interface DiffCommResult { buffer1: string[]; buffer2: string[] }
type CommResult = CommonCommResult | DiffCommResult;

/**
 * Attempts a 3-way merge between to JSON strings
 */
export function attemptMergeJson(
  existingContents: string,
  newContents: string,
  originalContents: string
): string | null {
  try {
    const originalJson = JSON.parse(originalContents) as Record<
      string,
      unknown
    >;
    const newJson = JSON.parse(newContents) as Record<string, unknown>;
    const existingJson = JSON.parse(existingContents) as Record<
      string,
      unknown
    >;
    const diff = jsonPatch.compare(originalJson, newJson, true);

    if (diff.length === 0) {
      return existingContents;
    }

    return JSON.stringify(
      jsonPatch.applyPatch(existingJson, diff, true, false).newDocument,
      null,
      2
    );
  } catch (e) {
    // default to merge strings method if patching fails
    return null;
  }
}

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
