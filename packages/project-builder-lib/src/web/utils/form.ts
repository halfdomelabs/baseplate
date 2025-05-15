export function setUndefinedIfEmpty(value: unknown): unknown {
  if (value === '') return undefined;
  return value;
}
