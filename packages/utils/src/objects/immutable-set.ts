import { isPlainObject } from 'es-toolkit';

/**
 * Sets a value at a given path in an object or array immutably.
 *
 * Mimics lodash set but returns a new object/array and throws on invalid paths.
 * Only operates on JSON-stringifyable data (objects and arrays).
 *
 * It navigates the path and recursively copies objects/arrays along the path.
 *
 * @param obj - The object or array to modify
 * @param path - The path to set the value at
 * @param value - The value to set
 * @returns A new object or array with the value set
 * @throws Error if the path is invalid (e.g., trying to set a property on a non-object)
 */
export function immutableSet<T = unknown>(
  obj: T,
  path: (string | number)[],
  value: unknown,
): T {
  if (path.length === 0) {
    return value as T;
  }

  const [head, ...tail] = path;

  if (Array.isArray(obj)) {
    if (typeof head !== 'number') {
      throw new TypeError(
        `Invalid path: expected number index for array, got "${head}"`,
      );
    }
    const newArr = [...obj] as unknown[];
    newArr[head] =
      tail.length === 0
        ? value
        : immutableSet(obj[head] as unknown, tail, value);
    return newArr as T;
  }

  if (isPlainObject(obj)) {
    const newObj = { ...obj };
    const key = String(head);
    (newObj as Record<string, unknown>)[key] =
      tail.length === 0
        ? value
        : immutableSet((obj as Record<string, unknown>)[key], tail, value);
    return newObj as unknown as T;
  }

  throw new Error(
    `Invalid path: cannot set property "${head}" on non-object value`,
  );
}
