// @ts-nocheck

import { builder } from '%pothosImports';

export const booleanFilter = builder.inputType('BooleanFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'Boolean' }),
    not: t.field({ type: 'Boolean' }),
  }),
});

export const dateFilter = builder.inputType('DateFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'Date' }),
    not: t.field({ type: 'Date' }),
    in: t.field({ type: ['Date'] }),
    notIn: t.field({ type: ['Date'] }),
    lt: t.field({ type: 'Date' }),
    lte: t.field({ type: 'Date' }),
    gt: t.field({ type: 'Date' }),
    gte: t.field({ type: 'Date' }),
  }),
});

export const dateTimeFilter = builder.inputType('DateTimeFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'DateTime' }),
    not: t.field({ type: 'DateTime' }),
    in: t.field({ type: ['DateTime'] }),
    notIn: t.field({ type: ['DateTime'] }),
    lt: t.field({ type: 'DateTime' }),
    lte: t.field({ type: 'DateTime' }),
    gt: t.field({ type: 'DateTime' }),
    gte: t.field({ type: 'DateTime' }),
  }),
});

export const floatFilter = builder.inputType('FloatFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'Float' }),
    not: t.field({ type: 'Float' }),
    in: t.field({ type: ['Float'] }),
    notIn: t.field({ type: ['Float'] }),
    lt: t.field({ type: 'Float' }),
    lte: t.field({ type: 'Float' }),
    gt: t.field({ type: 'Float' }),
    gte: t.field({ type: 'Float' }),
  }),
});

export const intFilter = builder.inputType('IntFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'Int' }),
    not: t.field({ type: 'Int' }),
    in: t.field({ type: ['Int'] }),
    notIn: t.field({ type: ['Int'] }),
    lt: t.field({ type: 'Int' }),
    lte: t.field({ type: 'Int' }),
    gt: t.field({ type: 'Int' }),
    gte: t.field({ type: 'Int' }),
  }),
});

export const stringFilter = builder.inputType('StringFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'String' }),
    not: t.field({ type: 'String' }),
    in: t.field({ type: ['String'] }),
    notIn: t.field({ type: ['String'] }),
    lt: t.field({ type: 'String' }),
    lte: t.field({ type: 'String' }),
    gt: t.field({ type: 'String' }),
    gte: t.field({ type: 'String' }),
    contains: t.field({ type: 'String' }),
    startsWith: t.field({ type: 'String' }),
    endsWith: t.field({ type: 'String' }),
  }),
});

export const uuidFilter = builder.inputType('UuidFilter', {
  fields: (t) => ({
    equals: t.field({ type: 'Uuid' }),
    not: t.field({ type: 'Uuid' }),
    in: t.field({ type: ['Uuid'] }),
    notIn: t.field({ type: ['Uuid'] }),
    lt: t.field({ type: 'Uuid' }),
    lte: t.field({ type: 'Uuid' }),
    gt: t.field({ type: 'Uuid' }),
    gte: t.field({ type: 'Uuid' }),
  }),
});

/**
 * Recursively checks that a WhereInput value's AND/OR/NOT nesting does not
 * exceed maxDepth, that the total number of AND/OR/NOT clauses across the
 * whole tree does not exceed maxClauseCount, and that no scalar filter's
 * `in`/`notIn` operand array is longer than maxClauseCount. GraphQL's own
 * query complexity/depth limiting only measures the selection set, not
 * argument values, so a `where` filter's shape must be bounded separately.
 * The configured limits are passed in by each query's `validate` call.
 *
 * Depth alone doesn't bound breadth — `{ OR: [ ...500 clauses... ] }` stays
 * at depth 2 no matter how many clauses are in the array — so both checks
 * run in the same pass. Nor does the AND/OR/NOT clause count bound a single
 * field's `in`/`notIn` array — `{ name: { in: [ ...100000 strings... ] } }`
 * has one clause at depth 1, so it needs its own bound.
 */
export function validateWhereComplexity(
  where: unknown,
  maxDepth: number,
  maxClauseCount: number,
): boolean {
  let clauseCount = 0;

  function hasOversizedOperandArray(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > maxClauseCount;
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some((v) => hasOversizedOperandArray(v));
    }
    return false;
  }

  function walk(value: unknown, depth: number): boolean {
    if (!value || typeof value !== 'object') {
      return true;
    }
    if (hasOversizedOperandArray(value)) {
      return false;
    }
    const { AND, OR, NOT } = value as {
      AND?: unknown[];
      OR?: unknown[];
      NOT?: unknown;
    };
    const nested = [...(AND ?? []), ...(OR ?? []), ...(NOT ? [NOT] : [])];
    if (nested.length === 0) {
      return true;
    }
    if (depth >= maxDepth) {
      return false;
    }
    clauseCount += nested.length;
    if (clauseCount > maxClauseCount) {
      return false;
    }
    return nested.every((clause) => walk(clause, depth + 1));
  }

  return walk(where, 0);
}
