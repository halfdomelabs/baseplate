export function stripUndefinedChildren<T extends Record<string, unknown>>(
  obj: T,
): T {
  return Object.keys(obj).reduce((acc, key) => {
    const item = obj[key];
    if (item === undefined) {
      return acc;
    }
    return {
      ...acc,
      [key]: item,
    };
  }, {} as T);
}

export function undefinedIfEmptyObject<T extends Record<string, unknown>>(
  obj: T,
): T | undefined {
  return Object.keys(obj).every((key) => obj[key] === undefined)
    ? undefined
    : obj;
}
