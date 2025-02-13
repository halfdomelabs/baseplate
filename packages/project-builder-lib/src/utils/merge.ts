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
