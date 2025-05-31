import type { GeneratorDescriptorChildren } from '@baseplate-dev/sync';

import { pickBy } from 'es-toolkit';

/**
 * Strip object of any values that are empty arrays, empty objects, null, or undefined
 */
export function stripEmptyGeneratorChildren(
  children: GeneratorDescriptorChildren,
): GeneratorDescriptorChildren {
  return pickBy(
    children,
    (value) =>
      value !== undefined && !(Array.isArray(value) && value.length === 0),
  );
}

/**
 * Strip object of any values that are undefined
 */
export function stripUndefinedValues<T>(
  obj: Record<string, T | undefined>,
): Record<string, T> {
  return pickBy(obj, (value) => value !== undefined) as Record<string, T>;
}

/**
 * Returns undefined if the value is an empty object (as defined by all values are undefined)/array/null, otherwise return value.
 */
export function undefinedIfEmpty<T>(value: T): T | undefined {
  if (value === null) return undefined;
  if (Array.isArray(value) && value.length === 0) {
    return undefined;
  }
  if (
    typeof value === 'object' &&
    Object.keys(value).every(
      (key) => (value as Record<string, unknown>)[key] === undefined,
    )
  ) {
    return undefined;
  }
  return value;
}

/**
 * Returns undefined if the value is falsy, otherwise return value.
 */
export function undefinedIfFalsy<T>(value: T): T | undefined {
  if (!value) return undefined;
  return value;
}
