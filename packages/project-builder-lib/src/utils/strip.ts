/**
 * Strip object of any values that are empty arrays, empty objects, null, or undefined
 */
export function stripChildren(
  children: Record<string, unknown>,
): Record<string, unknown> {
  return Object.keys(children).reduce((acc, key) => {
    const item = children[key];
    if (
      item === undefined ||
      item === null ||
      (Array.isArray(item) && item.length === 0)
    ) {
      return acc;
    }
    return {
      ...acc,
      [key]: item,
    };
  }, {});
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
