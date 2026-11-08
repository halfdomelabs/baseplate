import { pickBy } from 'es-toolkit';

/**
 * Strip object of any values that are undefined
 */
export function stripUndefinedValues<T>(
  obj: Record<string, T | undefined>,
): Record<string, T> {
  return pickBy(obj, (value) => value !== undefined) as Record<string, T>;
}
