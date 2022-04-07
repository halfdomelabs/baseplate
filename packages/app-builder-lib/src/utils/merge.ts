import R from 'ramda';

export function safeMerge(
  itemOne: Record<string, unknown>,
  itemTwo: Record<string, unknown>
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return R.mergeWithKey((key) => {
    throw new Error(`Cannot merge key ${key} because it already exists.`);
  })(itemOne, itemTwo);
}
