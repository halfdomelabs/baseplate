import * as R from 'ramda';

export function safeMergeMap<K, V>(
  map1: Map<K, V>,
  map2: Map<K, V>,
): Map<K, V> {
  const result = new Map<K, V>(map1);

  for (const [key, value] of map2) {
    if (result.has(key)) {
      throw new Error(`Duplicate key found during merge: ${String(key)}`);
    }
    result.set(key, value);
  }

  return result;
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
    return [...new Set([...(a as unknown[]), ...(b as unknown[])])];
  }

  return b;
}
