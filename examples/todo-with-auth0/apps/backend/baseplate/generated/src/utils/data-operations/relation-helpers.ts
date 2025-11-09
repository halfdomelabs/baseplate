/**
 * Type helper to check if a record type has any undefined values.
 *
 * @template T - Record type to check
 */
type HasUndefinedValues<T extends Record<string, unknown>> =
  undefined extends T[keyof T] ? true : false;

/**
 * Type helper to check if a record type has any null values.
 *
 * @template T - Record type to check
 */
type HasNullValues<T extends Record<string, unknown>> = null extends T[keyof T]
  ? true
  : false;

/**
 * Type helper to check if a record type has any undefined or null values.
 * Used for conditional return types in relation helpers.
 *
 * @template T - Record type to check
 */
type HasUndefinedOrNullValues<T extends Record<string, unknown>> =
  HasUndefinedValues<T> extends true
    ? true
    : HasNullValues<T> extends true
      ? true
      : false;

/**
 * Creates a Prisma connect object for create operations
 *
 * Returns undefined if any value in the data object is null or undefined,
 * allowing optional relations in create operations.
 *
 * @template TUniqueWhere - Object containing the unique identifier(s) for the relation
 * @param data - Object with one or more key-value pairs representing the unique identifier(s)
 * @returns Prisma connect object or undefined if any value is null/undefined
 *
 * @example
 * // Single field - required relation
 * todoList: relationHelpers.connectCreate({ id: todoListId })
 *
 * @example
 * // Single field - optional relation (returns undefined if assigneeId is null/undefined)
 * assignee: relationHelpers.connectCreate({ id: assigneeId })
 *
 * @example
 * // Composite key - required relation
 * owner: relationHelpers.connectCreate({ userId, tenantId })
 *
 * @example
 * // Composite key - optional relation (returns undefined if any field is null/undefined)
 * assignee: relationHelpers.connectCreate({ userId, organizationId })
 */
function connectCreate<
  TUniqueWhere extends Record<string, string | undefined | null>,
>(
  data: TUniqueWhere,
):
  | (HasUndefinedOrNullValues<TUniqueWhere> extends true ? undefined : never)
  | { connect: { [K in keyof TUniqueWhere]: string } } {
  const values = Object.values(data);
  // Return undefined if any value is null or undefined (for optional relations)
  if (values.some((value) => value === undefined || value === null)) {
    return undefined as HasUndefinedOrNullValues<TUniqueWhere> extends true
      ? undefined
      : never;
  }
  return {
    connect: data as { [K in keyof TUniqueWhere]: string },
  };
}

/**
 * Creates a Prisma connect/disconnect object for update operations
 *
 * Handles three cases:
 * - All values present: returns connect object to update the relation
 * - Any value is null: returns { disconnect: true } to remove the relation
 * - Any value is undefined: returns undefined to leave the relation unchanged
 *
 * @template TUniqueWhere - Object containing the unique identifier(s) for the relation
 * @param data - Object with one or more key-value pairs representing the unique identifier(s)
 * @returns Prisma connect/disconnect object, or undefined if no change
 *
 * @example
 * // Single field - update to a new assignee
 * assignee: relationHelpers.connectUpdate({ id: 'user-2' })
 *
 * @example
 * // Single field - disconnect the assignee (set to null)
 * assignee: relationHelpers.connectUpdate({ id: null })
 *
 * @example
 * // Single field - leave the assignee unchanged
 * assignee: relationHelpers.connectUpdate({ id: undefined })
 *
 * @example
 * // Composite key - update to a new relation
 * owner: relationHelpers.connectUpdate({ userId: 'user-2', tenantId: 'tenant-1' })
 *
 * @example
 * // Composite key - disconnect (if any field is null)
 * owner: relationHelpers.connectUpdate({ userId: null, tenantId: 'tenant-1' })
 *
 * @example
 * // Composite key - no change (if any field is undefined)
 * owner: relationHelpers.connectUpdate({ userId: undefined, tenantId: 'tenant-1' })
 */
function connectUpdate<
  TUniqueWhere extends Record<string, string | undefined | null>,
>(
  data: TUniqueWhere,
):
  | (HasUndefinedValues<TUniqueWhere> extends true ? undefined : never)
  | (HasNullValues<TUniqueWhere> extends true ? { disconnect: true } : never)
  | { connect: { [K in keyof TUniqueWhere]: string } } {
  const values = Object.values(data);
  const hasUndefined = values.includes(undefined);
  const hasNull = values.includes(null);

  // If any value is undefined, leave relation unchanged
  if (hasUndefined) {
    return undefined as HasUndefinedValues<TUniqueWhere> extends true
      ? undefined
      : never;
  }

  // If any value is null, disconnect the relation
  if (hasNull) {
    return {
      disconnect: true,
    } as HasNullValues<TUniqueWhere> extends true
      ? { disconnect: true }
      : never;
  }

  // All values are present, connect to the new relation
  return { connect: data as { [K in keyof TUniqueWhere]: string } };
}

/**
 * Relation helpers for transforming scalar IDs into Prisma relation objects
 *
 * These helpers provide type-safe ways to connect and disconnect relations
 * in Prisma operations, with proper handling of optional relations and
 * support for both single-field and composite key relations.
 *
 * @example
 * // In a create operation with single field relations
 * buildData: ({ todoListId, assigneeId, ...rest }) => ({
 *   todoList: relationHelpers.connectCreate({ id: todoListId }),
 *   assignee: relationHelpers.connectCreate({ id: assigneeId }), // undefined if assigneeId is null
 *   ...rest,
 * })
 *
 * @example
 * // In a create operation with composite key relation
 * buildData: ({ userId, tenantId, ...rest }) => ({
 *   owner: relationHelpers.connectCreate({ userId, tenantId }), // undefined if any field is null
 *   ...rest,
 * })
 *
 * @example
 * // In an update operation with single field
 * buildData: ({ assigneeId, ...rest }) => ({
 *   assignee: relationHelpers.connectUpdate({ id: assigneeId }),
 *   ...rest,
 * })
 *
 * @example
 * // In an update operation with composite key
 * buildData: ({ userId, tenantId, ...rest }) => ({
 *   owner: relationHelpers.connectUpdate({ userId, tenantId }),
 *   ...rest,
 * })
 */
export const relationHelpers = {
  /**
   * Creates a connect object for create operations
   * Returns undefined if the ID is null or undefined
   */
  connectCreate,

  /**
   * Creates a connect/disconnect object for update operations
   * - null: disconnects the relation
   * - undefined: no change to the relation
   * - value: connects to the new relation
   */
  connectUpdate,
};
