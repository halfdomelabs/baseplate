/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

// having a field day with anys :)

function isObjectEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.length === 0;
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  return false;
}

/**
 * Cleans up object recursively to remove any properties that are undefined/null/empty arrays/objects
 *
 * @param obj Object to clean up
 * @returns
 */
export function stripObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  if (Array.isArray(obj)) {
    const strippedArray = obj
      .map(stripObject)
      .filter((subItem) => !isObjectEmpty(subItem));
    if (strippedArray.length === 0) {
      return undefined;
    }
    return strippedArray;
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const item = stripObject(obj[key]);
      if (isObjectEmpty(item)) {
        return acc;
      }
      return {
        ...acc,
        [key]: item,
      };
    }, {});
  }
  return obj;
}
