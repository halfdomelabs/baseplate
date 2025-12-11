import type { Paths } from 'type-fest';

import type { RefContextSlot } from './ref-context-slot.js';
import type {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
} from './types.js';

export type PathInput<Type> = Exclude<Paths<Type>, number>;

/**
 * Allows the caller to resolve the name of an entity, optionally providing a
 * map of entity ids that need to be resolved prior to resolving the entity's
 * name.
 */
export interface DefinitionEntityNameResolver<
  TEntityIds extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> {
  /**
   * Optional map of entity ids that need to be resolved prior to resolving the
   * entity's name.
   */
  idsToResolve?: TEntityIds;
  /**
   * Resolves the name of an entity from the provided entity names.
   * @param entityNames - A map of entity ids to their names.
   * @returns The name of the entity.
   */
  resolveName: (entityNames: TEntityIds) => string;
}

/**
 * Creates a definition entity name resolver.
 * @param entityNameResolver - The entity name resolver.
 * @returns The definition entity name resolver.
 */
export function createDefinitionEntityNameResolver<
  TEntityIds extends Record<string, string | string[]>,
>(
  entityNameResolver: DefinitionEntityNameResolver<TEntityIds>,
): DefinitionEntityNameResolver<TEntityIds> {
  return entityNameResolver;
}

/**
 * Base definition for entity input.
 *
 * @template TInput - The overall input data type.
 * @template TEntityType - The entity type, extending DefinitionEntityType.
 * @template TPath - The type representing a path in TInput (e.g. a dot-separated string); defaults to undefined.
 * @template TIdKey - The key type for the entity's id; defaults to "id".
 */
interface DefinitionEntityInputBase<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIdKey = 'id',
> {
  /** The entity type definition. */
  type: TEntityType;
  /** Optional dot-separated string representing the location of the entity within the input. */
  path?: TPath;
  /** Optional path key used to store the entity's id; if not provided, the id is assumed to be under the entity's path with key "id". */
  idPath?: TIdKey;
  /** Optional function used to get the name resolver from the input data. Otherwise, the entity's name is assumed to be under the entity's path with key "name". */
  getNameResolver?: (
    value: TInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed to allow more specific generic typed to be put in here
  ) => DefinitionEntityNameResolver<any> | string;
  /** Optional ref context slot that this entity provides. Registers this entity's path in a shared context. */
  provides?: RefContextSlot<TEntityType>;
}

/**
 * Entity input when a parent reference is required.
 */
interface DefinitionEntityInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TPath, TIDKey> {
  /** The slot from which to resolve the parent entity path. */
  parentSlot: RefContextSlot<NonNullable<TEntityType['parentType']>>;
}

/**
 * Entity input when no parent reference is expected.
 */
interface DefinitionEntityInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TPath, TIDKey> {
  parentSlot?: never;
}

/**
 * Depending on the entity type’s requirements, this type resolves to either the
 * with- or without-parent version.
 */
export type DefinitionEntityInput<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> = TEntityType['parentType'] extends undefined
  ? DefinitionEntityInputWithoutParent<TInput, TEntityType, TPath, TIDKey>
  : DefinitionEntityInputWithParent<TInput, TEntityType, TPath, TIDKey>;

/**
 * Base interface for defining a reference input.
 * @template TInput - The overall input type.
 * @template TEntityType - The entity type.
 */
interface DefinitionReferenceInputBase<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends Pick<DefinitionReference, 'onDelete'> {
  type: TEntityType;
  path?: PathInput<TInput>;
  /** Optional ref context slot that this reference provides. Registers this reference's path in a shared context. */
  provides?: RefContextSlot<TEntityType>;
}

interface DefinitionReferenceInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionReferenceInputBase<TInput, TEntityType> {
  /** The slot from which to resolve the parent entity path. */
  parentSlot: RefContextSlot<NonNullable<TEntityType['parentType']>>;
}

interface DefinitionReferenceInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionReferenceInputBase<TInput, TEntityType> {
  parentSlot?: never;
}

/**
 * Depending on the entity type’s requirements, defines the input required to create a definition reference.
 */
export type DefinitionReferenceInput<
  TInput,
  TEntityType extends DefinitionEntityType,
> = TEntityType['parentType'] extends undefined
  ? DefinitionReferenceInputWithoutParent<TInput, TEntityType>
  : DefinitionReferenceInputWithParent<TInput, TEntityType>;

/**
 * Entity with a name resolver.
 */
export interface DefinitionEntityWithNameResolver
  extends Omit<DefinitionEntity, 'name'> {
  nameResolver: DefinitionEntityNameResolver | string;
}
