export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}

export function notString<TValue>(value: TValue | string): value is TValue {
  return typeof value !== 'string';
}
