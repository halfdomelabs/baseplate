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
 * any `select` or `include` arguments provided.
 *
 * @template TModelName - The Prisma model name
 * @template TQueryArgs - Optional query arguments (select/include)
 *
 * @example
 * ```typescript
 * // Basic user type
 * type User = GetPayload<'user'>;
 *
 * // User with posts included
 * type UserWithPosts = GetPayload<'user', { include: { posts: true } }>;
 *
 * // User with only specific fields
 * type UserNameEmail = GetPayload<'user', { select: { name: true, email: true } }>;
 * ```
 */
export type GetPayload<
  TModelName extends ModelPropName,
  TQueryArgs = undefined,
> = Result<(typeof prisma)[TModelName], TQueryArgs, 'findUniqueOrThrow'>;

/**
 * Type for Prisma query arguments (select/include) for a given model.
 *
 * Used to shape the returned data from database operations by specifying
 * which fields to select or which relations to include.
 *
 * @template TModelName - The Prisma model name
 *
 * @example
 * ```typescript
 * const query: ModelQuery<'user'> = {
 *   select: { id: true, name: true, email: true },
 * };
 *
 * const queryWithInclude: ModelQuery<'user'> = {
 *   include: { posts: true, profile: true },
 * };
 * ```
 */
export type ModelQuery<TModelName extends ModelPropName> = Pick<
  Args<(typeof prisma)[TModelName], 'findUnique'>,
  'select' | 'include'
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
