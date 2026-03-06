// @ts-nocheck

import type { ModelPropName, WhereInput } from '%dataUtilsImports';

/**
 * Result of combining where clauses — either a Prisma where input or a boolean.
 * - `true` means "match everything" (no filter needed)
 * - `false` means "match nothing"
 * - `WhereInput` is a Prisma where clause
 */
export type WhereResult<TModelName extends ModelPropName> =
  | WhereInput<TModelName>
  | boolean;

/**
 * Helpers for combining Prisma where clauses with proper boolean logic.
 *
 * These handle edge cases that Prisma doesn't handle correctly:
 * - Empty `{ OR: [] }` should mean "match nothing" but Prisma ignores it in
 *   compound queries (see https://github.com/prisma/prisma/issues/17367)
 * - Single-element arrays are unwrapped to avoid unnecessary wrappers
 * - Boolean values enable short-circuit evaluation
 */
export const queryHelpers = {
  /**
   * Combine where clauses with OR logic.
   *
   * - If any clause is `true` → returns `true` (short-circuit)
   * - Filters out `false` entries
   * - Empty after filtering → returns `false`
   * - Single element → unwrap
   * - Multiple elements → `{ OR: [...] }`
   */
  or<TModelName extends ModelPropName>(
    clauses: WhereResult<TModelName>[],
  ): WhereResult<TModelName> {
    if (clauses.includes(true)) return true;

    const filtered = clauses.filter(
      (c): c is WhereInput<TModelName> => c !== false,
    );

    if (filtered.length === 0) return false;
    if (filtered.length === 1) return filtered[0];
    return { OR: filtered } as WhereInput<TModelName>;
  },

  /**
   * Combine where clauses with AND logic.
   *
   * - If any clause is `false` → returns `false` (short-circuit)
   * - Filters out `true` entries
   * - Empty after filtering → returns `true` (vacuous truth)
   * - Single element → unwrap
   * - Multiple elements → `{ AND: [...] }`
   */
  and<TModelName extends ModelPropName>(
    clauses: WhereResult<TModelName>[],
  ): WhereResult<TModelName> {
    if (clauses.includes(false)) return false;

    const filtered = clauses.filter(
      (c): c is WhereInput<TModelName> => c !== true,
    );

    if (filtered.length === 0) return true;
    if (filtered.length === 1) return filtered[0];
    return { AND: filtered } as WhereInput<TModelName>;
  },
};
