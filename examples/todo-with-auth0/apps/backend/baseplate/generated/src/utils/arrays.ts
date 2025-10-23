/**
 * Checks if a value is not null or undefined.
 *
 * @param value - The value to check.
 * @returns `true` if the value is not null or undefined, otherwise `false`.
 */
export function notEmpty<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== null && value !== undefined;
}
