import { cloneDeep } from 'es-toolkit';

type TransformFn<From = unknown, To = unknown> = (input: From) => To;

/**
 * Transform a value at a specific path in a JSON object.
 *
 * @param data - The JSON object to transform.
 * @param path - The path to the value to transform, using dot notation (* matches all elements in an array).
 * @param transformFn - The transformation function to apply to the value.
 * @returns The transformed JSON object.
 */
export function transformJsonPath(
  data: unknown,
  path: string,
  transformFn: TransformFn,
): unknown {
  // Split the path into parts
  const pathParts = path.split('.');

  // Recursive function to navigate and transform the JSON
  const navigateAndTransform = (current: unknown, parts: string[]): unknown => {
    if (parts.length === 0) {
      // If at the end of the path, apply the transformation function
      return transformFn(cloneDeep(current));
    }

    const [currentPart, ...remainingParts] = parts;

    if (currentPart === '*') {
      // If the current path part is a wildcard
      if (!Array.isArray(current)) {
        throw new TypeError(`Expected an array at ${pathParts.join('.')}`);
      }
      // Apply transformation recursively for each item
      return current.map((item) => navigateAndTransform(item, remainingParts));
    } else {
      if (typeof current !== 'object') {
        throw new TypeError(
          `Expected an object at ${pathParts.join('.')}, got ${typeof current}`,
        );
      }
      // Navigate deeper
      if (current === null || !(currentPart in current)) {
        return current;
      }
      return {
        ...current,
        [currentPart]: navigateAndTransform(
          (current as Record<string, unknown>)[currentPart],
          remainingParts,
        ),
      };
    }
  };

  // Start the navigation and transformation process
  return navigateAndTransform(data, pathParts);
}

export function renameObjectKeyTransform(
  oldKey: string,
  newKey: string,
): TransformFn {
  return (data) => {
    if (data === null) return null;
    if (typeof data !== 'object') {
      throw new TypeError(`Expected an object, got ${typeof data}`);
    }
    const { [oldKey]: oldValue, ...rest } = data as Record<string, unknown>;
    if (oldValue === undefined) {
      return data;
    }
    return {
      ...rest,
      [newKey]: oldValue,
    };
  };
}
