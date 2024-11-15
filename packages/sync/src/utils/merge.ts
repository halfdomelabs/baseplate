import jsonPatch from 'fast-json-patch';
import { diffComm, merge } from 'node-diff3';

/**
 * Merges a variable number of `Map` instances or arrays of entries (`[key, value]`)
 * into a single `Map`. Throws an error if duplicate keys are found.
 *
 * @param {...(Map | [key, value][])[]} maps - A variable number of `Map` instances or arrays of entries to merge.
 * @returns {Map} - A new `Map` containing the merged entries.
 * @throws {Error} If a duplicate key is found across the provided maps.
 *
 * @example
 * const map1 = new Map([['a', 1]]);
 * const map2 = new Map([['b', 2]]);
 * const arrayEntries = [['c', 3]];
 * const result = safeMergeMap(map1, map2, arrayEntries);
 * // Result: Map { 'a' => 1, 'b' => 2, 'c' => 3 }
 *
 * @example
 * const map1 = new Map([['a', 1]]);
 * const map2 = new Map([['a', 2]]);
 * safeMergeMap(map1, map2); // Throws Error: Duplicate key found during merge: a
 */
export function safeMergeMap<K, V>(
  ...maps: (Map<K, V> | [K, V][])[]
): Map<K, V> {
  const result = new Map<K, V>();

  for (const map of maps) {
    for (const [key, value] of map) {
      if (result.has(key)) {
        throw new Error(`Duplicate key found during merge: ${String(key)}`);
      }
      result.set(key, value);
    }
  }

  return result;
}

interface CommonCommResult {
  common: string[];
}
interface DiffCommResult {
  buffer1: string[];
  buffer2: string[];
}
type CommResult = CommonCommResult | DiffCommResult;

/**
 * Attempts a 3-way merge between to JSON strings
 */
export function attemptMergeJson(
  existingContents: string,
  newContents: string,
  originalContents: string,
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
      2,
    );
  } catch {
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
  originalContents?: string,
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
    newContents.split('\n'),
  );

  const isCommonCommResult = (r: CommResult): r is CommonCommResult =>
    'common' in r;

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
