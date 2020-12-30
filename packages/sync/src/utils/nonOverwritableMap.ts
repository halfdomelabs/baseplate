import R from 'ramda';

export interface NonOverwriteableMap<T extends object> {
  merge(value: Partial<T>): void;
  // merges in additional values and only keeps in unique ones
  mergeUnique(value: Partial<T>): void;
  value(): T;
}

/**
 * Map that doesn't let users overwrite content (that isn't default)
 */
export function createNonOverwriteableMap<T extends object>(
  defaults: T,
  owner: string
): NonOverwriteableMap<T> {
  let values: Partial<T> = {};
  const merge = R.mergeWithKey((key, a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.concat(b);
    }
    throw new Error(`Field ${key} already has value in ${owner}`);
  });
  const mergeUnique = R.mergeWithKey((key, a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return R.uniq(a.concat(b));
    }
    throw new Error(`Field ${key} already has value in ${owner}`);
  });
  return {
    merge(value) {
      values = merge(values, value);
    },
    mergeUnique(value) {
      values = mergeUnique(values, value);
    },
    value() {
      return R.mergeLeft(values, defaults) as T;
    },
  };
}
