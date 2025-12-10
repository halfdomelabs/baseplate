import type { Paths } from 'type-fest';

import { get } from 'es-toolkit/compat';

import type { RefContextSlot } from './ref-context-slot.js';
import type {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
  ReferencePath,
} from './types.js';

import { stripRefMarkers } from './strip-ref-markers.js';

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
  parentRef: RefContextSlot<NonNullable<TEntityType['parentType']>>;
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
  parentRef?: never;
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
  parentRef: RefContextSlot<NonNullable<TEntityType['parentType']>>;
}

interface DefinitionReferenceInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionReferenceInputBase<TInput, TEntityType> {
  parentRef?: never;
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
interface DefinitionEntityWithNameResolver
  extends Omit<DefinitionEntity, 'name'> {
  nameResolver: DefinitionEntityNameResolver;
}

export interface RefBuilderContext {
  /** Maps slot IDs to their registered paths and types */
  pathMap: Map<symbol, { path: ReferencePath; type: DefinitionEntityType }>;
}

export interface ZodRefBuilderInterface<TInput> {
  addReference<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<TInput, TEntityType>,
  ): void;
  addEntity<
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<TInput> | undefined = undefined,
    TIDKey extends string | PathInput<TInput> = 'id',
  >(
    entity: DefinitionEntityInput<TInput, TEntityType, TPath, TIDKey>,
  ): void;
  /**
   * Registers a path in the context for a given slot.
   * @param path - The dot-separated string path to register
   * @param slot - The ref context slot to register the path under
   */
  addPathToContext<TEntityType extends DefinitionEntityType>(
    path: PathInput<TInput>,
    slot: RefContextSlot<TEntityType>,
  ): void;
}

/**
 * DefinitionRefBuilder is responsible for constructing reference paths, and registering
 * references and entities as defined in a Zod schema.
 *
 * The builder uses a prefix (usually the current parsing path) and context (a
 * shared map for resolving relative references) to build complete reference paths.
 *
 * @template TInput - The type of the input data being parsed.
 */
export class DefinitionRefBuilder<TInput>
  implements ZodRefBuilderInterface<TInput>
{
  readonly references: DefinitionReference[];
  readonly entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
  readonly pathPrefix: ReferencePath;
  readonly context: RefBuilderContext;
  readonly pathMap: Map<
    symbol,
    { path: ReferencePath; type: DefinitionEntityType }
  >;
  readonly data: TInput;

  /**
   * Creates a new builder instance.
   * @param pathPrefix - The starting path for all references.
   * @param context - Shared context including a path map and deserialize flag.
   * @param data - The data being parsed.
   */
  constructor(
    pathPrefix: ReferencePath,
    context: RefBuilderContext,
    data: TInput,
  ) {
    this.references = [];
    this.entitiesWithNameResolver = [];
    this.pathPrefix = pathPrefix;
    this.context = context;
    this.pathMap = new Map();
    this.data = data;
  }

  /**
   * Converts a dot-separated string path into an array of keys.
   * @param path - A string (e.g. "a.b.0.c") representing the path.
   * @returns An array of keys (numbers for numeric strings, otherwise strings).
   */
  protected _constructPathWithoutPrefix(
    path: PathInput<TInput> | undefined,
  ): ReferencePath {
    if (!path) return [];

    const pathComponents = path
      .split('.')
      .map((key) => (/^[0-9]+$/.test(key) ? Number.parseInt(key, 10) : key));

    return pathComponents;
  }

  /**
   * Prepends the builder's path prefix to the provided path.
   * @param path - The dot-separated path string.
   * @returns The complete reference path as an array.
   */
  protected _constructPath(path: PathInput<TInput> | undefined): ReferencePath {
    if (!path) return this.pathPrefix;

    return [...this.pathPrefix, ...this._constructPathWithoutPrefix(path)];
  }

  /**
   * Looks up the path registered for a slot from the builder's context.
   *
   * @param slot - The ref context slot to look up.
   * @param expectedEntityType - The entity type expected for this slot.
   * @returns The resolved reference path.
   * @throws If the slot is not found or its type does not match.
   */
  protected _constructPathFromSlot(
    slot: RefContextSlot,
    expectedEntityType: DefinitionEntityType,
  ): ReferencePath {
    // Lookup the context for the given slot.
    const pathContext = this.context.pathMap.get(slot._slotId);
    if (!pathContext) {
      throw new Error(
        `Could not find context for slot (${slot.entityType.name}) from ${this.pathPrefix.join('.')}. ` +
          `Make sure the parent entity uses 'provides: slot' to register its path.`,
      );
    }
    if (pathContext.type !== expectedEntityType) {
      throw new Error(
        `Slot type mismatch at ${this.pathPrefix.join('.')}: ` +
          `expected ${expectedEntityType.name}, but slot contains ${pathContext.type.name}`,
      );
    }
    return pathContext.path;
  }

  /**
   * Registers a reference based on the provided input definition.
   *
   * Flow:
   * 1. Validate that the parent ref is provided if required (and vice versa).
   * 2. Compute the reference path; if the path is empty, use the entire data.
   * 3. If the referenced value is null or undefined, skip adding the reference.
   * 4. Otherwise, add the reference and, if requested, register its slot.
   *
   * @param reference - The reference definition.
   * @throws If parent ref usage is incorrect.
   */
  addReference<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<TInput, TEntityType>,
  ): void {
    if (!reference.type.parentType && reference.parentRef) {
      throw new Error(
        `parentRef does nothing since reference type does not have parentType`,
      );
    }
    if (reference.type.parentType && !reference.parentRef) {
      throw new Error(
        `parentRef is required when reference type has parentType`,
      );
    }

    // Compute the path without prefix once.
    const refPathWithoutPrefix = this._constructPathWithoutPrefix(
      reference.path,
    );
    // If the path is empty, use the entire data; otherwise, retrieve the value.
    const refValue =
      refPathWithoutPrefix.length === 0
        ? this.data
        : (get(this.data, refPathWithoutPrefix) as string);
    if (refValue === undefined || refValue === null) return;

    const fullPath = this._constructPath(reference.path);

    this.references.push({
      type: reference.type,
      path: fullPath,
      parentPath:
        reference.parentRef &&
        reference.type.parentType &&
        this._constructPathFromSlot(
          reference.parentRef,
          reference.type.parentType,
        ),
      onDelete: reference.onDelete,
    });

    // Optionally, register this path in the shared context for the provided slot.
    if (reference.provides) {
      this._addSlotToContext(fullPath, reference.provides);
    }
  }

  /**
   * Registers an entity based on the provided definition.
   *
   * Flow:
   * 1. Compute the full entity path.
   * 2. Resolve the entity ID:
   *    - Use the provided idPath if available; otherwise, default to appending 'id'
   *      to the entity path.
   * 3. Resolve the entity name:
   *    - Use the provided getNameResolver if available; otherwise, default to using the
   *      name property.
   * 4. Register the entity in the entities list.
   * 5. Optionally, register the entity's id path in the slot context.
   *
   * @param entity - The entity definition.
   * @throws If no id or name resolver is found.
   */
  addEntity<
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<TInput> | undefined = undefined,
    TIDKey extends string | PathInput<TInput> = 'id',
  >(entity: DefinitionEntityInput<TInput, TEntityType, TPath, TIDKey>): void {
    // Build the full path for the entity.
    const path = this._constructPath(entity.path);

    // Resolve the id path: if provided use it; otherwise, assume the id is at "entity.path.id"
    const idPath = entity.idPath
      ? this._constructPathWithoutPrefix(entity.idPath as PathInput<TInput>)
      : [...this._constructPathWithoutPrefix(entity.path), 'id'];

    const id = get(this.data, idPath) as string;

    if (!id) {
      throw new Error(`No id found for entity ${entity.type.name}`);
    }

    if (!entity.type.isId(id)) {
      throw new Error(`Invalid id: ${id} for entity ${entity.type.name}`);
    }

    // Resolve the name: if getNameResolver is provided, use it to build the name resolver; otherwise,
    // use the default name resolver.
    const getNameResolver =
      entity.getNameResolver ??
      ((value) => get(value, 'name') as string | undefined);
    const nameResolver = getNameResolver(stripRefMarkers(this.data));

    if (!nameResolver) {
      throw new Error(
        `No name resolver found for entity ${entity.type.name} at ${path.join(
          '.',
        )}`,
      );
    }

    // Base entity definition shared between regular entities and those with a name reference.
    const entityBase = {
      id,
      type: entity.type,
      path,
      idPath: [...this.pathPrefix, ...idPath],
      parentPath:
        entity.parentRef &&
        entity.type.parentType &&
        this._constructPathFromSlot(entity.parentRef, entity.type.parentType),
    };

    this.entitiesWithNameResolver.push({
      ...entityBase,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- needed to allow more specific generic typed to be put in here
      nameResolver:
        typeof nameResolver === 'string'
          ? { resolveName: () => nameResolver }
          : nameResolver,
    });

    // Optionally register the id path in the slot context.
    if (entity.provides) {
      this._addSlotToContext([...this.pathPrefix, ...idPath], entity.provides);
    }
  }

  /**
   * Registers a given path into the builder's context map for a slot.
   * @param path - The full reference path.
   * @param slot - The ref context slot to register.
   */
  _addSlotToContext(path: ReferencePath, slot: RefContextSlot): void {
    // Allow overriding slots during array iteration
    this.pathMap.set(slot._slotId, { path, type: slot.entityType });
    // Also register in the shared context for other builders to access
    this.context.pathMap.set(slot._slotId, { path, type: slot.entityType });
  }

  /**
   * Convenience method that builds a full path from a dot-separated string and
   * registers it in the context for a slot.
   * @param path - The dot-separated string path.
   * @param slot - The ref context slot to register the path under.
   */
  addPathToContext<TEntityType extends DefinitionEntityType>(
    path: PathInput<TInput>,
    slot: RefContextSlot<TEntityType>,
  ): void {
    this._addSlotToContext(this._constructPath(path), slot);
  }

  /**
   * Pre-registers the slot for an entity without full processing.
   * Used to ensure slots are available before parentRef lookups.
   * @param entity - The entity definition.
   */
  preRegisterEntitySlot<
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<TInput> | undefined = undefined,
    TIDKey extends string | PathInput<TInput> = 'id',
  >(entity: DefinitionEntityInput<TInput, TEntityType, TPath, TIDKey>): void {
    if (!entity.provides) return;
    const idPath = entity.idPath
      ? this._constructPathWithoutPrefix(entity.idPath as PathInput<TInput>)
      : [...this._constructPathWithoutPrefix(entity.path), 'id'];
    this._addSlotToContext([...this.pathPrefix, ...idPath], entity.provides);
  }

  /**
   * Pre-registers the slot for a reference without full processing.
   * Used to ensure slots are available before parentRef lookups.
   * @param reference - The reference definition.
   */
  preRegisterReferenceSlot<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<TInput, TEntityType>,
  ): void {
    if (!reference.provides) return;
    // Check if the reference value exists (same check as addReference)
    const refPathWithoutPrefix = this._constructPathWithoutPrefix(
      reference.path,
    );
    const refValue =
      refPathWithoutPrefix.length === 0
        ? this.data
        : (get(this.data, refPathWithoutPrefix) as string);
    if (refValue === undefined || refValue === null) return;

    const fullPath = this._constructPath(reference.path);
    this._addSlotToContext(fullPath, reference.provides);
  }
}

/**
 * Function type for builder functions that register references and entities.
 *
 * @template Input - The input data type.
 */
export type ZodBuilderFunction<Input> = (
  builder: ZodRefBuilderInterface<Input>,
  data: Input,
) => void;

/**
 * Payload returned after parsing, containing the data, references, and entities.
 *
 * @template TData - The type of the parsed data.
 */
export interface ZodRefPayload<TData> {
  data: TData;
  references: DefinitionReference[];
  entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
}
