import { isEqual } from 'es-toolkit';

interface MergeMapOptions {
  /**
   * If true, allows merging values that are deeply equal
   */
  allowEqualValues?: boolean;
}

/**
 * Merges an array of maps, throwing an error if any keys overlap (unless the values are deeply equal and allowed).
 *
 * @param maps - The array of maps to merge.
 * @param options - Options to control merge behavior.
 * @returns The merged map.
 */
export function safeMergeMapsWithOptions<K, V>(
  maps: Map<K, V>[],
  options: MergeMapOptions = {},
): Map<K, V> {
  const result = new Map<K, V>();

  for (const map of maps) {
    for (const [key, value] of map) {
      if (result.has(key)) {
        const existing = result.get(key);
        if (!options.allowEqualValues || !isEqual(existing, value)) {
          throw new Error(
            `Cannot merge key ${String(key)} because it already exists.`,
          );
        }
      }
      result.set(key, value);
    }
  }

  return result;
}

/**
 * Merges two maps, throwing an error if any keys overlap.
 *
 * @param mapOne - The first map to merge.
 * @param mapTwo - The second map to merge.
 * @param options - Options to control merge behavior
 * @returns The merged map.
 */
export function safeMergeMap<K, V>(
  mapOne: Map<K, V>,
  mapTwo: Map<K, V>,
  options: MergeMapOptions = {},
): Map<K, V> {
  return safeMergeMapsWithOptions([mapOne, mapTwo], options);
}

/**
 * Merges an array of maps, throwing an error if any keys overlap (unless the values are deeply equal and allowed).
 * This function delegates to safeMergeMapsWithOptions.
 *
 * @param maps - The array of maps to merge.
 * @returns The merged map.
 */
export function safeMergeMaps<K, V>(...maps: Map<K, V>[]): Map<K, V> {
  return safeMergeMapsWithOptions(maps);
}
