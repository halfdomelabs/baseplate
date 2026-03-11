// @ts-nocheck

import type { Prisma } from '%prismaGeneratedImports';
import type { prisma } from '%prismaImports';
import type { Args, Result } from '@prisma/client/runtime/client';

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
 * type User = GetPayload<'user'>;
 *
 * // User with posts included
 * type UserWithPosts = GetPayload<'user', { include: { posts: true } }>;
 * ```
 */
export type GetPayload<
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
 * will be stripped by `GetPayload`.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const query: ModelInclude<'user'> = {
 *   include: { posts: true, profile: true },
 * };
 * ```
 */
export type ModelInclude<TModelName extends ModelPropName> = {
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

/**
 * Type for Prisma unique where clauses for finding a single record.
 *
 * Used in `findUnique`, `update`, `delete`, and `upsert` operations
 * to specify which record to operate on using unique fields.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * // By ID
 * const where1: WhereUniqueInput<'user'> = { id: 'user-123' };
 *
 * // By unique email
 * const where2: WhereUniqueInput<'user'> = { email: 'user@example.com' };
 *
 * // By compound unique constraint
 * const where3: WhereUniqueInput<'membership'> = {
 *   userId_teamId: { userId: 'user-1', teamId: 'team-1' },
 * };
 * ```
 */
export type WhereUniqueInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'findUnique'
>['where'];

/**
 * Type for Prisma create input data for a given model.
 *
 * Represents the shape of data accepted by `create` operations.
 * Includes all required fields and optional fields, with support for
 * nested creates via relation fields.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const createData: CreateInput<'user'> = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   posts: {
 *     create: [{ title: 'First post', content: '...' }],
 *   },
 * };
 * ```
 */
export type CreateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'create'
>['data'];

/**
 * Type for Prisma update input data for a given model.
 *
 * Represents the shape of data accepted by `update` operations.
 * All fields are optional (partial updates), with support for
 * nested updates, creates, and deletes via relation fields.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const updateData: UpdateInput<'user'> = {
 *   name: 'Jane Doe', // Only updating name
 *   posts: {
 *     update: [{ where: { id: 'post-1' }, data: { title: 'Updated title' } }],
 *     create: [{ title: 'New post', content: '...' }],
 *   },
 * };
 * ```
 */
export type UpdateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'update'
>['data'];
