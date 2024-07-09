import * as R from 'ramda';

export function safeMerge<T extends Record<string, unknown>>(
  itemOne: T,
  itemTwo: T,
): T {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return R.mergeWithKey((key) => {
    throw new Error(`Cannot merge key ${key} because it already exists.`);
  })(itemOne, itemTwo);
}

export function deepMergeRightUniq(a: unknown, b: unknown): unknown {
  if (a == null) {
    return b;
  }
  if (b == null) {
    return a;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return R.mergeWith(deepMergeRightUniq, a, b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return R.uniq(R.concat(a, b)) as unknown;
  }

  return b;
}
