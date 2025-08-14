import type { Paths } from 'type-fest';

import { get } from 'es-toolkit/compat';

import type {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
  ReferencePath,
} from './types.js';

import { stripRefMarkers } from './strip-ref-markers.js';

export type PathInput<Type> = Exclude<Paths<Type>, number>;

interface ContextValue {
  context: string;
}

type PathInputOrContext<Type> = PathInput<Type> | ContextValue;

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
  /** Optional context identifier used to register the entity's path in a shared context. */
  addContext?: string;
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
  parentPath: PathInputOrContext<TInput>;
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
  parentPath?: never;
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
  addContext?: string;
}

interface DefinitionReferenceInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionReferenceInputBase<TInput, TEntityType> {
  parentPath: PathInputOrContext<TInput>;
}

interface DefinitionReferenceInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionReferenceInputBase<TInput, TEntityType> {
  parentPath?: never;
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
  pathMap: Map<string, { path: ReferencePath; type: DefinitionEntityType }>;
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
  addPathToContext(
    path: PathInput<TInput>,
    type: DefinitionEntityType,
    context: string,
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
    string,
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
   * Constructs a reference path that may be defined directly as a string or indirectly
   * via a context object. If a context object is provided, the function looks up the
   * actual path from the builder's context.
   *
   * @param path - Either a dot-separated string path or an object with a context key.
   * @param expectedEntityType - The entity type expected for this context.
   * @returns The resolved reference path.
   * @throws If the context cannot be found or its type does not match.
   */
  protected _constructPathWithContext(
    path: PathInputOrContext<TInput>,
    expectedEntityType: DefinitionEntityType,
  ): ReferencePath {
    if (typeof path === 'string') {
      return this._constructPath(path);
    }
    // Lookup the context for the given key.
    const pathContext = this.context.pathMap.get(path.context);
    if (!pathContext) {
      throw new Error(
        `Could not find context for ${path.context} from ${this.pathPrefix.join('.')}`,
      );
    }
    if (pathContext.type !== expectedEntityType) {
      throw new Error(
        `Attempted to retrieve context for ${path.context} from ${this.pathPrefix.join(
          '.',
        )} expecting ${expectedEntityType.name}, but found ${pathContext.type.name}`,
      );
    }
    return pathContext.path;
  }

  /**
   * Registers a reference based on the provided input definition.
   *
   * Flow:
   * 1. Validate that the parent path is provided if required (and vice versa).
   * 2. Compute the reference path; if the path is empty, use the entire data.
   * 3. If the referenced value is null or undefined, skip adding the reference.
   * 4. Otherwise, add the reference and, if requested, register its context.
   *
   * @param reference - The reference definition.
   * @throws If parent path usage is incorrect.
   */
  addReference<TEntityType extends DefinitionEntityType>(
    reference: DefinitionReferenceInput<TInput, TEntityType>,
  ): void {
    if (!reference.type.parentType && reference.parentPath) {
      throw new Error(
        `Parent path does nothing since reference does not have parent`,
      );
    }
    if (reference.type.parentType && !reference.parentPath) {
      throw new Error(`Parent path required if reference type has parent type`);
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
        reference.parentPath &&
        reference.type.parentType &&
        this._constructPathWithContext(
          reference.parentPath,
          reference.type.parentType,
        ),
      onDelete: reference.onDelete,
    });

    // Optionally, add this path to the shared context.
    if (reference.addContext) {
      this._addPathToContext(fullPath, reference.type, reference.addContext);
    }
  }

  /**
   * Registers an entity based on the provided definition.
   *
   * Flow:
   * 1. Validate that not both a name and a name reference path are provided.
   * 2. Compute the full entity path.
   * 3. Resolve the entity ID:
   *    - Use the provided idPath if available; otherwise, default to appending 'id'
   *      to the entity path.
   *    - If no id is found, generate a new one.
   * 4. Resolve the entity name:
   *    - Use the provided resolveName if available; otherwise, default to using the
   *      name path.
   * 5. Register the entity in either the direct entities list or the name-ref list.
   * 6. Optionally, add the entity’s id path to the shared context.
   *
   * @param entity - The entity definition.
   * @throws If both name and nameRefPath are provided or if no name is resolved.
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
        entity.parentPath &&
        entity.type.parentType &&
        this._constructPathWithContext(
          entity.parentPath,
          entity.type.parentType,
        ),
    };

    this.entitiesWithNameResolver.push({
      ...entityBase,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- needed to allow more specific generic typed to be put in here
      nameResolver:
        typeof nameResolver === 'string'
          ? { resolveName: () => nameResolver }
          : nameResolver,
    });

    // Optionally add the id path to the context.
    if (entity.addContext) {
      this._addPathToContext(
        [...this.pathPrefix, ...idPath],
        entity.type,
        entity.addContext,
      );
    }
  }

  /**
   * Registers a given path into the builder's context map.
   * @param path - The full reference path.
   * @param type - The entity type associated with the path.
   * @param context - A unique key to identify this context.
   * @throws If the context key is already registered.
   */
  _addPathToContext(
    path: ReferencePath,
    type: DefinitionEntityType,
    context: string,
  ): void {
    // For now, allow overriding contexts to maintain compatibility
    this.pathMap.set(context, { path, type });
    // Also register in the shared context for other builders to access
    this.context.pathMap.set(context, { path, type });
  }

  /**
   * Convenience method that builds a full path from a dot-separated string and
   * adds it to the context.
   * @param path - The dot-separated string path.
   * @param type - The entity type.
   * @param context - The context key.
   */
  addPathToContext(
    path: PathInput<TInput>,
    type: DefinitionEntityType,
    context: string,
  ): void {
    this._addPathToContext(this._constructPath(path), type, context);
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
