import { isEqual, mergeWith } from 'es-toolkit';

export interface MergeOptions {
  /**
   * If true, allows merging values that are deeply equal
   */
  allowEqualValues?: boolean;
}

/**
 * Merges two objects, throwing an error if any keys overlap.
 *
 * @param itemOne - The first object to merge.
 * @param itemTwo - The second object to merge.
 * @param options - Options to control merge behavior
 * @returns The merged object.
 */
export function safeMerge<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  T extends Record<PropertyKey, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  S extends Record<PropertyKey, any>,
>(itemOne: T, itemTwo: S, options: MergeOptions = {}): T & S {
  return mergeWith(itemOne, itemTwo, (targetValue, sourceValue, key) => {
    if (key in itemOne && key in itemTwo) {
      if (options.allowEqualValues && isEqual(targetValue, sourceValue)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we're just using the sourceValue
        return sourceValue;
      }
      throw new Error(`Cannot merge key ${key} because it already exists.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we're just using the sourceValue
    return sourceValue;
  });
}

/**
 * Merges an array of objects, throwing an error if any keys overlap.
 *
 * @param items - The array of objects to merge.
 * @param options - Options to control merge behavior
 * @returns The merged object.
 */
export function safeMergeAllWithOptions<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  T extends Record<PropertyKey, any>,
>(items: T[], options: MergeOptions = {}): T {
  const targetValue = {} as T;
  for (const item of items.flat()) {
    safeMerge(targetValue, item, options);
  }
  return targetValue;
}

/**
 * Merges an array of objects, throwing an error if any keys overlap.
 *
 * @param items - The array of objects to merge.
 * @returns The merged object.
 */
export function safeMergeAll<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  T extends Record<PropertyKey, any>,
>(...items: T[]): T {
  return safeMergeAllWithOptions(items);
}
