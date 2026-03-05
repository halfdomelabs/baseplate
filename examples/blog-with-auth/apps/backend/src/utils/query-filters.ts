import type {
  ModelPropName,
  WhereInput,
} from './data-operations/prisma-types.js';
import type { WhereResult } from './query-helpers.js';
import type { ServiceContext } from './service-context.js';

import { ForbiddenError } from './http-errors.js';

/**
 * A where clause in the shape `{ OR: [...] }`.
 * This is the consistent shape returned by `buildWhere`.
 */
interface OrWhereClause<TModelName extends ModelPropName> {
  OR: NonNullable<WhereInput<TModelName>>[];
}

/**
 * A query filter role function that returns a Prisma where clause or a boolean.
 *
 * - Return a `WhereInput` to filter records by a condition
 * - Return `true` to indicate the user has unrestricted access (no filter)
 * - Return `false` to indicate the user has no access through this role
 *
 * @example
 * ```typescript
 * // Owner role: filter to own records, unless admin
 * const ownerRole: QueryFilterRole<'todoList'> = (ctx) =>
 *   ctx.auth.hasRole('admin') ? true : { ownerId: ctx.auth.userId };
 * ```
 */
export type QueryFilterRole<TModelName extends ModelPropName> = (
  ctx: ServiceContext,
) => WhereResult<TModelName>;

/**
 * Configuration for creating a model query filter.
 */
export interface ModelQueryFilterConfig<
  TModelName extends ModelPropName,
  TRoles extends Record<string, QueryFilterRole<TModelName>>,
> {
  /** Prisma model name */
  model: TModelName;

  /** Named query filter role functions */
  roles: TRoles;
}

/**
 * A model query filter — registry of query filter role functions for a model.
 *
 * Analogous to `ModelAuthorizer` but produces Prisma where clauses
 * instead of boolean checks. Used to filter query results based on
 * the authenticated user's permissions.
 */
export interface ModelQueryFilter<
  TModelName extends ModelPropName,
  TRoles extends Record<string, QueryFilterRole<TModelName>>,
> {
  /** The model name */
  readonly model: TModelName;

  /** The role definitions */
  readonly roles: Readonly<TRoles>;

  /**
   * Build a combined where clause for the given role names.
   *
   * Evaluates each role and combines with OR logic (user needs to
   * satisfy at least one role). Returns `undefined` if any role
   * grants unrestricted access.
   *
   * @param ctx - Service context with auth info
   * @param roleNames - Which roles to evaluate
   * @returns A `{ OR: [...] }` where clause, or `undefined` if no filtering needed
   * @throws {ForbiddenError} If all roles deny access
   */
  buildWhere(
    ctx: ServiceContext,
    roleNames: (keyof TRoles)[],
  ): OrWhereClause<TModelName> | undefined;
}

/**
 * Creates a model query filter — a registry of query filter role functions.
 *
 * @example
 * ```typescript
 * const todoListQueryFilter = createModelQueryFilter({
 *   model: 'todoList',
 *   roles: {
 *     owner: (ctx) =>
 *       ctx.auth.hasRole('admin') ? true : { ownerId: ctx.auth.userId },
 *   },
 * });
 *
 * // In a list query resolver:
 * const authWhere = todoListQueryFilter.buildWhere(ctx, ['owner']);
 * prisma.todoList.findMany({ where: authWhere });
 *
 * // In a get query resolver:
 * const authWhere = todoListQueryFilter.buildWhere(ctx, ['owner']);
 * prisma.todoList.findUniqueOrThrow({
 *   where: { id, ...(authWhere != null ? { AND: [authWhere] } : {}) },
 * });
 * ```
 */
export function createModelQueryFilter<
  TModelName extends ModelPropName,
  TRoles extends Record<string, QueryFilterRole<TModelName>>,
>(
  config: ModelQueryFilterConfig<TModelName, TRoles>,
): ModelQueryFilter<TModelName, TRoles> {
  return {
    model: config.model,
    roles: config.roles,

    buildWhere(ctx, roleNames): OrWhereClause<TModelName> | undefined {
      const results = roleNames.map((name) => config.roles[name](ctx));

      // If any role grants unrestricted access, no filter needed
      if (results.includes(true)) return undefined;

      // Collect the where clauses, filtering out false entries
      const whereClauses = results.filter(
        (r): r is NonNullable<WhereInput<TModelName>> =>
          r !== false && r != null,
      );

      // No clauses passed → no access at all
      if (whereClauses.length === 0) {
        throw new ForbiddenError('Forbidden');
      }

      return { OR: whereClauses };
    },
  };
}
