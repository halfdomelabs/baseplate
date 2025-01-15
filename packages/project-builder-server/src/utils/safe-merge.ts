import { mergeWith } from 'es-toolkit';

/**
 * Merges two objects, throwing an error if any keys overlap.
 *
 * @param itemOne - The first object to merge.
 * @param itemTwo - The second object to merge.
 * @returns The merged object.
 */
export function safeMerge<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  T extends Record<PropertyKey, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  S extends Record<PropertyKey, any>,
>(itemOne: T, itemTwo: S): T & S {
  return mergeWith(itemOne, itemTwo, (targetValue, sourceValue, key) => {
    if (key in itemOne && key in itemTwo) {
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
 * @returns The merged object.
 */
export function safeMergeAll<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- we're just using the mergeWith function typings
  T extends Record<PropertyKey, any>,
>(...items: T[]): T {
  const targetValue = {} as T;
  for (const item of items) {
    safeMerge(targetValue, item);
  }
  return targetValue;
}
