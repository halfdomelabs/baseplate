import { pickBy } from 'es-toolkit';

export function stripUndefinedChildren<T extends Record<string, unknown>>(
  obj: T,
): T {
  return pickBy(obj, (value) => value !== undefined) as T;
}

export function undefinedIfEmptyObject<T extends Record<string, unknown>>(
  obj: T,
): T | undefined {
  return Object.keys(obj).every((key) => obj[key] === undefined)
    ? undefined
    : obj;
}
