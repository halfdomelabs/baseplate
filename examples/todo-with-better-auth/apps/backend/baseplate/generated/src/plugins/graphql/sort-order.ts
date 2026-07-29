import { builder } from './builder.js';

export const sortOrderEnum = builder.enumType('SortOrder', {
  values: { ASC: { value: 'asc' }, DESC: { value: 'desc' } },
});

/**
 * Resolves a Prisma `orderBy`, falling back to `defaultSort` when the caller
 * supplies none and appending the model's ID field(s) as a tiebreaker.
 *
 * The tiebreaker keeps cursor pagination stable: Prisma only guarantees
 * non-skipping/non-repeating pages when `orderBy` is a total order.
 *
 * @param orderBy - The caller-supplied sort clauses, if any.
 * @param idFields - The model's ID field(s), appended as a tiebreaker.
 * @param defaultSort - Used when the caller supplies no sort.
 * @returns The resolved clauses, or `undefined` when empty.
 */
export function applyStableOrderBy<T extends Record<string, 'asc' | 'desc'>>(
  orderBy: T[] | null | undefined,
  idFields: string[],
  defaultSort: Record<string, 'asc' | 'desc'>[] = [],
): (T | Record<string, 'asc' | 'desc'>)[] | undefined {
  // Every field on an OrderByInput is optional, so `[{}]` is a valid input,
  // and an empty clause reaching Prisma throws at runtime.
  const callerClauses = (orderBy ?? []).filter(
    (clause) => Object.keys(clause).length > 0,
  );
  const clauses = callerClauses.length > 0 ? callerClauses : defaultSort;
  // Derived after the fallback so a default sorting on an ID field doesn't
  // get a duplicate tiebreaker appended.
  const specifiedFields = new Set(
    clauses.flatMap((clause) => Object.keys(clause)),
  );
  const tiebreakers = idFields
    .filter((field) => !specifiedFields.has(field))
    .map((field) => ({ [field]: 'asc' as const }));
  const result = [...clauses, ...tiebreakers];
  return result.length > 0 ? result : undefined;
}
