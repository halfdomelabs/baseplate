import type { Args, Result } from '@prisma/client/runtime/client';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { prisma } from '@src/services/prisma.js';

/**
 * Union type of all Prisma model names (e.g., 'user', 'post', 'comment').
 *
 * Used as a constraint for generic type parameters to ensure only valid
 * Prisma model names are used.
 */
export type ModelPropName = Prisma.TypeMap['meta']['modelProps'];

/**
 * Infers the return type of a Prisma query for a given model and query arguments.
 *
 * This type extracts the shape of data returned from a Prisma query, respecting
 * any `include` arguments provided. Only the `include` key from `TIncludeArgs` is
 * forwarded to Prisma's Result type; `select` is stripped to avoid producing
 * an unresolvable union type.
 *
 * @template TModelName - The Prisma model name
 * @template TIncludeArgs - Optional query arguments (include only)
 *
 * @example
 * ```typescript
 * // Basic user type
 * type User = GetResult<'user'>;
 *
 * // User with posts included
 * type UserWithPosts = GetResult<'user', { include: { posts: true } }>;
 * ```
 */
export type GetResult<
  TModelName extends ModelPropName,
  TIncludeArgs = undefined,
> = Result<
  (typeof prisma)[TModelName],
  TIncludeArgs extends undefined
    ? undefined
    : { include: TIncludeArgs extends { include?: infer I } ? I : undefined },
  'findUniqueOrThrow'
>;

/**
 * Type for Prisma include arguments for a given model.
 *
 * Used to shape the returned data from database operations by specifying
 * which relations to include. Only `include` is supported; `select` is
 * accepted as `undefined` for compatibility with `queryFromInfo()` but
 * will be stripped by `GetResult`.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const query: DataQuery<'user'> = {
 *   include: { posts: true, profile: true },
 * };
 * ```
 */
export type DataQuery<TModelName extends ModelPropName> = {
  select?: undefined;
} & Pick<
  Args<(typeof prisma)[TModelName], 'findUnique'> extends { include?: infer I }
    ? { include?: I }
    : { include?: undefined },
  'include'
>;

/**
 * Type for Prisma where clauses for filtering records.
 *
 * Used in `findMany`, `updateMany`, `deleteMany` operations to specify
 * which records to operate on.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const where: WhereInput<'user'> = {
 *   email: { contains: '@example.com' },
 *   AND: [{ isActive: true }, { createdAt: { gt: new Date('2024-01-01') } }],
 * };
 * ```
 */
export type WhereInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'findMany'
>['where'];
