/**
 * Type helper to check if a record type has any undefined or null values
 * Used for conditional return types in relation helpers
 */
type HasUndefinedOrNullValues<T extends Record<string, unknown>> =
  undefined extends T[keyof T] ? true : null extends T[keyof T] ? true : false;

/**
 * Creates a Prisma connect object for create operations
 *
 * Returns undefined if any value in the data object is null or undefined,
 * allowing optional relations in create operations.
 *
 * @template TUniqueWhere - Object containing the unique identifier(s) for the relation
 * @param data - Object with exactly one key-value pair representing the unique identifier
 * @returns Prisma connect object or undefined if the value is null/undefined
 * @throws Error if data doesn't contain exactly one field
 *
 * @example
 * // Required relation - value must be present
 * todoList: relationHelpers.connectCreate({ id: todoListId })
 *
 * @example
 * // Optional relation - returns undefined if assigneeId is null/undefined
 * assignee: relationHelpers.connectCreate({ id: assigneeId })
 */
function connectCreate<
  TUniqueWhere extends Record<string, string | undefined | null>,
>(
  data: TUniqueWhere,
):
  | (HasUndefinedOrNullValues<TUniqueWhere> extends true ? undefined : never)
  | { connect: { [K in keyof TUniqueWhere]: string } } {
  const values = Object.values(data);
  if (values.length !== 1) {
    throw new Error('Exactly one ID value is required in connectCreate');
  }
  if (values[0] === undefined || values[0] === null) {
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
 * - Value present: returns connect object to update the relation
 * - null: returns { disconnect: true } to remove the relation
 * - undefined: returns undefined to leave the relation unchanged
 *
 * @template TUniqueWhere - Object containing the unique identifier(s) for the relation
 * @param data - Object with exactly one key-value pair representing the unique identifier
 * @returns Prisma connect/disconnect object, or undefined if no change
 * @throws Error if data doesn't contain exactly one field
 *
 * @example
 * // Update to a new assignee
 * assignee: relationHelpers.connectUpdate({ id: 'user-2' })
 *
 * @example
 * // Disconnect the assignee (set to null)
 * assignee: relationHelpers.connectUpdate({ id: null })
 *
 * @example
 * // Leave the assignee unchanged (not in update data)
 * assignee: relationHelpers.connectUpdate({ id: undefined })
 */
function connectUpdate<
  TUniqueWhere extends Record<string, string | undefined | null>,
>(
  data: TUniqueWhere,
):
  | (HasUndefinedOrNullValues<TUniqueWhere> extends true
      ? undefined | { disconnect: true }
      : never)
  | { connect: { [K in keyof TUniqueWhere]: string } } {
  const values = Object.values(data);
  if (values.length !== 1) {
    throw new Error('Exactly one ID value is required in connectUpdate');
  }
  if (values[0] === undefined || values[0] === null) {
    return (
      values[0] === undefined ? undefined : { disconnect: true }
    ) as HasUndefinedOrNullValues<TUniqueWhere> extends true
      ? undefined | { disconnect: true }
      : never;
  }
  return { connect: data as { [K in keyof TUniqueWhere]: string } };
}

/**
 * Relation helpers for transforming scalar IDs into Prisma relation objects
 *
 * These helpers provide type-safe ways to connect and disconnect relations
 * in Prisma operations, with proper handling of optional relations.
 *
 * @example
 * // In a create operation
 * buildData: ({ todoListId, assigneeId, ...rest }) => ({
 *   todoList: relationHelpers.connectCreate({ id: todoListId }),
 *   assignee: relationHelpers.connectCreate({ id: assigneeId }), // undefined if assigneeId is null
 *   ...rest,
 * })
 *
 * @example
 * // In an update operation
 * buildData: ({ assigneeId, ...rest }) => ({
 *   assignee: relationHelpers.connectUpdate({ id: assigneeId }),
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
