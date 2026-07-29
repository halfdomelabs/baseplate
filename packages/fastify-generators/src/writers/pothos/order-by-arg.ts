import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

export const defaultSortSchema = z
  .array(
    z.object({
      fieldName: z.string().min(1),
      direction: z.enum(['asc', 'desc']),
    }),
  )
  .default([]);

export type DefaultSort = z.infer<typeof defaultSortSchema>;

/**
 * Renders a sort as a Prisma `orderBy` array literal, e.g.
 * `[{ position: 'asc' }, { id: 'asc' }]`. Uses the presorted merge because
 * sort precedence is positional — reordering the clauses changes the query.
 */
function renderClauses(
  clauses: { fieldName: string; direction: 'asc' | 'desc' }[],
): TsCodeFragment {
  return TsCodeUtils.mergeFragmentsAsArrayPresorted(
    clauses.map(({ fieldName, direction }) =>
      TsCodeUtils.mergeFragmentsAsObject({ [fieldName]: quot(direction) }),
    ),
  );
}

/**
 * Builds the `orderBy` value for a Prisma query, shared by the list,
 * connection, and relation-field generators.
 *
 * When the surface exposes no `orderBy` argument the result is fully known at
 * build time, so a literal is emitted rather than a call to the runtime helper
 * — this keeps a default sort working on surfaces that accept no arguments.
 *
 * @param options.argExpression - Expression holding the caller's sort, or undefined when the surface exposes no `orderBy` arg.
 * @param options.applyStableOrderByFragment - Reference to the runtime helper.
 * @param options.idFieldNames - The model's ID field(s), used as the tiebreaker.
 * @param options.defaultSort - The model's default sort, if any.
 * @returns The fragment to assign to Prisma's `orderBy`, or undefined when there is nothing to order by.
 */
export function buildOrderByValueFragment({
  argExpression,
  applyStableOrderByFragment,
  idFieldNames,
  defaultSort,
}: {
  argExpression?: string;
  applyStableOrderByFragment?: TsCodeFragment;
  idFieldNames: string[];
  defaultSort: DefaultSort;
}): TsCodeFragment | undefined {
  if (argExpression && applyStableOrderByFragment) {
    const defaultSortArg =
      defaultSort.length > 0 ? tsTemplate`, ${renderClauses(defaultSort)}` : '';
    return tsTemplate`${applyStableOrderByFragment}(${argExpression}, ${JSON.stringify(idFieldNames)}${defaultSortArg}) ?? undefined`;
  }

  if (defaultSort.length === 0) {
    return undefined;
  }

  // Mirrors the helper's tiebreaker rule: skip ID fields the default already sorts on.
  const defaultFields = new Set(defaultSort.map((entry) => entry.fieldName));
  return renderClauses([
    ...defaultSort,
    ...idFieldNames
      .filter((fieldName) => !defaultFields.has(fieldName))
      .map((fieldName) => ({ fieldName, direction: 'asc' as const })),
  ]);
}
