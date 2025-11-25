/**
 * Brand type for service DTO kinds with associated metadata.
 *
 * This allows creating strongly-typed kinds where each kind has
 * optional associated metadata type that is enforced at compile time
 *
 * @template TMetadata - The metadata type associated with this kind
 *
 * @example
 * ```typescript
 * const myKind = createServiceDtoKind<{ foo: string }>('my-kind');
 * // When using this kind, metadata must be { foo: string }
 * ```
 */
export interface ServiceDtoKind<TMetadata = undefined> {
  readonly name: string;
  readonly __metadata?: TMetadata;
}

/**
 * Factory function to create a strongly-typed DTO kind.
 *
 * Use this to define new kinds of injected service arguments.
 * The metadata type parameter defines what metadata is required when using this kind.
 *
 * @template TName - The string literal name for this kind
 * @template TMetadata - The metadata type for this kind (defaults to empty object)
 * @param name - The name of the kind
 * @returns A strongly-typed kind definition
 *
 * @example
 * ```typescript
 * // Kind with no metadata
 * const simpleKind = createServiceDtoKind<'simple', {}>('simple');
 *
 * // Kind with required metadata
 * const complexKind = createServiceDtoKind<'complex', {
 *   required: string;
 *   optional?: number;
 * }>('complex');
 * ```
 */
function createServiceDtoKind<TMetadata = undefined>(
  name: string,
): ServiceDtoKind<TMetadata> {
  return { name };
}

/**
 * Extract the metadata type from a kind.
 *
 * @template TKind - The service DTO kind to extract metadata from
 *
 * @example
 * ```typescript
 * const kind = createServiceDtoKind<'test', { value: number }>('test');
 * type Meta = InferKindMetadata<typeof kind>; // { value: number }
 * ```
 */
export type InferKindMetadata<TKind> =
  TKind extends ServiceDtoKind<infer TMeta> ? TMeta : never;

/**
 * Context argument kind.
 *
 * Provides service context (user info, request details, etc.) to the service function.
 * This argument is injected by the framework at runtime.
 */
export const contextKind = createServiceDtoKind('context');

/**
 * Prisma query argument kind.
 *
 * Provides Prisma select/include query options to shape the returned data.
 * This argument is typically constructed from GraphQL selection sets.
 */
export const prismaQueryKind = createServiceDtoKind('prisma-query');

/**
 * Where unique input argument kind.
 *
 * Maps an input field (typically 'id') to a Prisma where unique input.
 */
export const prismaWhereUniqueInputKind = createServiceDtoKind<{
  idFields: string[];
}>('prisma-where-unique-input');

/**
 * Skip validation argument kind.
 *
 * Skips Zod validation if data has already been validated (avoids double validation).
 */
export const skipValidationKind = createServiceDtoKind('skip-validation');
