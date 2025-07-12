/**
 * Recursively deep clones JSON-compatible values.
 * Throws if the value is not JSON-serializable.
 *
 * @param value - The value to clone
 * @returns A deep-cloned copy of the value
 * @throws Error if a non-JSON value is encountered
 */
export function jsonDeepClone<T>(value: T): T {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object') {
    if (value instanceof Date || value instanceof RegExp) {
      throw new TypeError(
        `Cannot clone value of unsupported type: ${value.constructor.name}`,
      );
    }

    if (Array.isArray(value)) {
      // Clone array elements
      const copy: unknown[] = [];
      for (const [i, element] of value.entries()) {
        copy[i] = jsonDeepClone(element);
      }
      return copy as T;
    }

    // Clone plain object properties
    const copy: Record<string, unknown> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const prop = (value as Record<string, unknown>)[key];
        copy[key] = jsonDeepClone(prop);
      }
    }
    return copy as T;
  }

  // Reject functions, symbols, BigInt, etc.
  throw new Error(`Cannot clone value of unsupported type: ${typeof value}`);
}
