import type { DefinitionEntityType } from './types.js';

/**
 * Symbol used to brand RefContextSlot instances for type safety.
 */
export const REF_CONTEXT_SLOT_SYMBOL = Symbol('refContextSlot');

/**
 * A typed slot representing a context that can be provided and consumed.
 * The type parameter T represents the DefinitionEntityType this slot is for.
 *
 * Slots are created via `createRefContextSlot()` or `ctx.refContext()`.
 * Each slot instance is unique - you cannot accidentally use a slot from
 * a different schema context.
 *
 * @example
 * ```typescript
 * const modelSlot = createRefContextSlot(modelEntityType);
 *
 * // Provider: marks this entity as providing the slot
 * ctx.withEnt(schema, { type: modelEntityType, provides: modelSlot });
 *
 * // Consumer: uses the slot for parent path resolution
 * ctx.withRef({ type: fieldEntityType, parentRef: modelSlot });
 * ```
 */
export interface RefContextSlot<
  T extends DefinitionEntityType = DefinitionEntityType,
> {
  readonly [REF_CONTEXT_SLOT_SYMBOL]: true;
  /** The entity type this slot is associated with */
  readonly entityType: T;
  /** Unique identifier for this slot instance */
  readonly _slotId: symbol;
}

/**
 * Creates a new ref context slot for the given entity type.
 * Each call creates a unique slot, even for the same entity type.
 *
 * @param entityType - The entity type this slot will be associated with
 * @returns A new unique RefContextSlot instance
 *
 * @example
 * ```typescript
 * const modelSlot = createRefContextSlot(modelEntityType);
 * const anotherModelSlot = createRefContextSlot(modelEntityType);
 *
 * // These are different slots despite same entity type
 * modelSlot._slotId !== anotherModelSlot._slotId
 * ```
 */
export function createRefContextSlot<T extends DefinitionEntityType>(
  entityType: T,
): RefContextSlot<T> {
  return {
    [REF_CONTEXT_SLOT_SYMBOL]: true,
    entityType,
    _slotId: Symbol('refContextSlot'),
  };
}

/**
 * Type guard to check if a value is a RefContextSlot.
 *
 * @param value - The value to check
 * @returns True if the value is a RefContextSlot
 */
export function isRefContextSlot(value: unknown): value is RefContextSlot {
  return (
    typeof value === 'object' &&
    value !== null &&
    REF_CONTEXT_SLOT_SYMBOL in value &&
    value[REF_CONTEXT_SLOT_SYMBOL] === true
  );
}

/**
 * A map of slot names to their entity types, used in refContext signatures.
 *
 * @example
 * ```typescript
 * const slotDef: RefContextSlotDefinition = {
 *   modelSlot: modelEntityType,
 *   foreignModelSlot: modelEntityType,
 * };
 * ```
 */
export type RefContextSlotDefinition = Record<string, DefinitionEntityType>;

/**
 * Converts a slot definition to actual RefContextSlot instances.
 * This is the type returned by refContext's callback parameter.
 *
 * @example
 * ```typescript
 * type SlotDef = { modelSlot: typeof modelEntityType };
 * type Slots = RefContextSlotMap<SlotDef>;
 * // Slots = { modelSlot: RefContextSlot<typeof modelEntityType> }
 * ```
 */
export type RefContextSlotMap<T extends RefContextSlotDefinition> = {
  [K in keyof T]: RefContextSlot<T[K]>;
};

/**
 * Helper type to extract entity type from a slot.
 */
export type SlotEntityType<T extends RefContextSlot> =
  T extends RefContextSlot<infer E> ? E : never;

/**
 * Creates a RefContextSlotMap from a slot definition.
 * Used internally by ctx.refContext().
 *
 * @param slotDefinition - Map of slot names to entity types
 * @returns Map of slot names to RefContextSlot instances
 */
export function createRefContextSlotMap<T extends RefContextSlotDefinition>(
  slotDefinition: T,
): RefContextSlotMap<T> {
  return Object.fromEntries(
    Object.entries(slotDefinition).map(([key, entityType]) => [
      key,
      createRefContextSlot(entityType),
    ]),
  ) as RefContextSlotMap<T>;
}
