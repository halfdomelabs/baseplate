import { builder } from './builder.js';

export const sortOrderEnum = builder.enumType('SortOrder', {
  values: { ASC: { value: 'asc' }, DESC: { value: 'desc' } },
});

/**
 * Appends a model's ID field(s) to `orderBy` as a tiebreaker, if not
 * already present. Prisma's cursor pagination only guarantees stable,
 * non-skipping/non-repeating pages when `orderBy` produces a total
 * order — ties on the caller's sort fields let the database return them
 * in a different order between paged queries. Returns `undefined` for
 * an empty result so callers can pass it straight through to Prisma's
 * `orderBy` option.
 */
export function applyStableOrderBy<T extends Record<string, 'asc' | 'desc'>>(
  orderBy: T[] | null | undefined,
  idFields: string[],
): (T | Record<string, 'asc'>)[] | undefined {
  const clauses = orderBy ?? [];
  const specifiedFields = new Set(
    clauses.flatMap((clause) => Object.keys(clause)),
  );
  const tiebreakers = idFields
    .filter((field) => !specifiedFields.has(field))
    .map((field) => ({ [field]: 'asc' as const }));
  const result = [...clauses, ...tiebreakers];
  return result.length > 0 ? result : undefined;
}
