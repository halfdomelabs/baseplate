export async function asyncFilter<T>(
  array: T[],
  predicate: (value: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(array.map(predicate));
  return array.filter((_, index) => results[index]);
}
