import type { Paths } from 'type-fest';
import type {
  input,
  ParseContext,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
  TypeOf,
  ZodTypeAny,
  ZodTypeDef,
} from 'zod';

import { get, set } from 'es-toolkit/compat';
import { z, ZodType } from 'zod';

import type {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
  ReferencePath,
} from './types.js';

/**
 * Zod reference ID schema: a string with a minimum length of 1.
 */
export const zRefId = z.string().min(1);

/**
 * Determines whether the given object is a Promise.
 * @param object - The value to test.
 * @returns True if the value is a Promise, false otherwise.
 */
function isPromise(object: unknown): object is Promise<unknown> {
  return object instanceof Promise;
}

type PathInput<Type> = Exclude<Paths<Type>, number>;

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
type DefinitionEntityInput<
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
type DefinitionReferenceInput<
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

interface RefBuilderContext {
  pathMap: Map<string, { path: ReferencePath; type: DefinitionEntityType }>;
}

/**
 * ZodRefBuilder is responsible for constructing reference paths, and registering
 * references and entities as defined in a Zod schema.
 *
 * The builder uses a prefix (usually the current parsing path) and context (a
 * shared map for resolving relative references) to build complete reference paths.
 *
 * @template TInput - The type of the input data being parsed.
 */
export class ZodRefBuilder<TInput> {
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
      entity.getNameResolver ?? ((value) => get(value, 'name') as string);
    const nameResolver = getNameResolver(this.data);

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
    if (this.pathMap.has(context)) {
      throw new Error(
        `Context path already defined for ${context} at ${this.pathPrefix.join('.')}`,
      );
    }
    this.pathMap.set(context, { path, type });
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
type ZodBuilderFunction<Input> = (
  builder: ZodRefBuilder<Input>,
  data: Input,
) => void;

/**
 * Definition for a ZodRef wrapper type that adds reference/entity capabilities.
 *
 * @template T - The inner Zod type.
 */
export interface ZodRefDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  builder?: ZodBuilderFunction<input<T>>;
}

/**
 * Unique symbol used to store ZodRef context in the parent’s common context.
 */
const zodRefSymbol = Symbol('zod-ref');

/**
 * Context for storing references, entities, and builder context.
 */
interface ZodRefContext {
  context: RefBuilderContext;
  references: DefinitionReference[];
  entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
}

/**
 * Extended common context that may contain a ZodRefContext.
 */
interface ExtendedCommonContext {
  [zodRefSymbol]?: ZodRefContext;
}

/**
 * ZodRef wraps an inner Zod type and enhances it with the ability to register
 * and process entity references. During parsing, it delegates to a builder (if present)
 * to collect references and entities before delegating to the inner type.
 *
 * @template T - The inner Zod type.
 */
export class ZodRef<T extends ZodTypeAny> extends ZodType<
  TypeOf<T>,
  ZodRefDef<T>,
  input<T>
> {
  /**
   * The core parse method that:
   * 1. Retrieves (or creates) the builder context from the parent.
   * 2. Runs the builder function (if present) to register references/entities.
   * 3. Delegates parsing to the inner type.
   * 4. Transforms the output to replace entity id placeholders with generated ids.
   *
   * @param input - The Zod parse input.
   * @returns The parse result.
   */
  _parse(input: ParseInput): ParseReturnType<TypeOf<T>> {
    const context = input.parent.common as ExtendedCommonContext;
    // If no builder context or builder function exists, simply parse using the inner type.
    const zodRefContext = context[zodRefSymbol];
    if (!zodRefContext || !this._def.builder) {
      return this._def.innerType._parse(input);
    }
    // Create a new builder instance for the current parsing context.
    const builder = new ZodRefBuilder<input<T>>(
      input.path,
      zodRefContext.context,
      input.data as input<T>,
    );
    // Execute the builder function to register references/entities.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this._def.builder(builder, input.data);
    zodRefContext.references.push(...builder.references);
    zodRefContext.entitiesWithNameResolver.push(
      ...builder.entitiesWithNameResolver,
    );

    // Re-parse using the inner type but merge the updated context.
    const parseOutput = this._def.innerType._parse({
      ...input,
      path: input.path,
      parent: {
        ...input.parent,
        common: {
          ...input.parent.common,
          [zodRefSymbol]: {
            ...zodRefContext,
            context: {
              ...zodRefContext.context,
              // Merge new context entries from the builder.
              pathMap: new Map([
                ...zodRefContext.context.pathMap,
                ...builder.pathMap,
              ]),
            },
          },
        },
      } as ParseContext,
    });

    /**
     * Transforms the output of the inner parse by iterating through all registered
     * entities and assigning the id to the corresponding path in the output in case
     * it was generated by the builder.
     *
     * @param output - The result from the inner parse.
     * @returns The transformed parse output.
     */
    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<unknown> {
      if (output.status === 'aborted') return output;

      // For each entity, assign the id to the corresponding path in the output
      // in the event that it was generated by the builder.
      for (const entity of builder.entitiesWithNameResolver) {
        set(
          output.value as object,
          entity.idPath.slice(input.path.length),
          entity.id,
        );
      }
      return output;
    }

    // If the parse result is a Promise, attach the transformation asynchronously.
    if (isPromise(parseOutput)) {
      return parseOutput.then(transformParseOutput);
    }

    return transformParseOutput(parseOutput);
  }

  /**
   * Returns the inner Zod type.
   * @returns The wrapped inner Zod type.
   */
  innerType(): T {
    return this._def.innerType;
  }

  /**
   * Adds an entity registration to the current ZodRef.
   *
   * @param entity - Either an entity definition or a function that returns one.
   * @returns A new ZodRef instance with the entity registration added.
   */
  addEntity<
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<input<T>> | undefined = undefined,
    TIDKey extends string = 'id',
  >(
    entity:
      | DefinitionEntityInput<input<T>, TEntityType, TPath, TIDKey>
      | ((
          data: input<T>,
        ) => DefinitionEntityInput<input<T>, TEntityType, TPath, TIDKey>),
  ): ZodRef<T> {
    return ZodRef.create(this, (builder, data) => {
      builder.addEntity(typeof entity === 'function' ? entity(data) : entity);
    }) as unknown as ZodRef<T>;
  }

  /**
   * Adds a reference registration to the current ZodRef.
   *
   * @param reference - Either a reference definition or a function that returns one.
   * @returns A new ZodRef instance with the reference registration added.
   */
  addReference<TEntityType extends DefinitionEntityType>(
    reference:
      | DefinitionReferenceInput<input<T>, TEntityType>
      | ((data: input<T>) => DefinitionReferenceInput<input<T>, TEntityType>),
  ): ZodRef<T> {
    return ZodRef.create(this, (builder, data) => {
      builder.addReference(
        typeof reference === 'function' ? reference(data) : reference,
      );
    }) as unknown as ZodRef<T>;
  }

  /**
   * Applies a custom builder function to the ZodRef.
   * @param builder - The builder function that registers additional references/entities.
   * @returns A new ZodRef instance with the builder applied.
   */
  refBuilder(builder: ZodBuilderFunction<input<T>>): ZodRef<T> {
    return ZodRef.create(this, builder) as unknown as ZodRef<T>;
  }

  /**
   * Creates a new ZodRef instance wrapping a given Zod type with an optional builder.
   * @param type - The inner Zod type.
   * @param builder - Optional builder function to register references/entities.
   * @returns A new ZodRef instance.
   */
  static create = <T extends ZodTypeAny>(
    type: T,
    builder?: ZodBuilderFunction<input<T>>,
  ): ZodRef<T> =>
    new ZodRef<T>({
      innerType: type,
      builder,
    });
}

/**
 * Convenience function for creating a ZodRef using a schema and an optional builder.
 * @param schema - The base Zod schema.
 * @param builder - Optional builder function.
 * @returns A new ZodRef instance.
 */
export function zRefBuilder<T extends z.ZodType>(
  schema: T,
  builder?: ZodBuilderFunction<TypeOf<T>>,
): ZodRef<T> {
  return ZodRef.create(schema, builder);
}

/**
 * Convenience function for creating a ZodRef with a reference added.
 * @param schema - The base Zod schema.
 * @param reference - Either a reference definition or a function returning one.
 * @returns A new ZodRef instance with the reference registration.
 */
export function zRef<
  T extends z.ZodType,
  TEntityType extends DefinitionEntityType,
>(
  schema: T,
  reference:
    | DefinitionReferenceInput<input<T>, TEntityType>
    | ((data: input<T>) => DefinitionReferenceInput<input<T>, TEntityType>),
): ZodRef<T> {
  return ZodRef.create(schema).addReference(reference);
}

/**
 * Convenience function for creating a ZodRef that registers an entity.
 * This function also sets the id key on the schema using zRefId.
 *
 * @template TObject - The Zod object type.
 * @template TEntityType - The entity type.
 * @template TPath - The path type.
 * @param schema - The base Zod object schema.
 * @param entity - Either an entity definition or a function returning one.
 * @returns A new ZodRef instance with the entity registration.
 */
export function zEnt<
  TObject extends z.SomeZodObject,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<input<TObject>>,
>(
  schema: TObject,
  entity:
    | DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>
    | ((
        data: z.input<TObject>,
      ) => DefinitionEntityInput<z.input<TObject>, TEntityType, TPath>),
): ZodRef<
  z.ZodObject<
    TObject['shape'] & {
      id: z.ZodType<string, z.ZodAnyDef, string>;
    },
    TObject['_def']['unknownKeys'],
    TObject['_def']['catchall']
  >
> {
  // Set the "id" key on the schema using zRefId and then register the entity.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return ZodRef.create(schema.setKey('id', zRefId)).addEntity(entity) as any;
}

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

/**
 * Definition for a ZodRefWrapper, which wraps a schema for collecting references and entities.
 *
 * @template T - The inner Zod type.
 */
export interface ZodRefWrapperDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
}

/**
 * ZodRefWrapper is used for initializing parsing that collects references and entities.
 *
 * @template T - The inner Zod type.
 */
export class ZodRefWrapper<T extends ZodTypeAny> extends ZodType<
  ZodRefPayload<TypeOf<T>>,
  ZodRefWrapperDef<T>,
  input<T>
> {
  /**
   * Core parse method that:
   * 1. Initializes a fresh reference context.
   * 2. Parses using the inner type while injecting the context.
   * 3. Returns a payload containing the parsed data, along with references and entities.
   *
   * @param input - The parse input.
   * @returns The parsed payload.
   */
  _parse(input: ParseInput): ParseReturnType<ZodRefPayload<TypeOf<T>>> {
    // Initialize the reference context.
    const refContext: ZodRefContext = {
      context: {
        pathMap: new Map(),
      },
      references: [],
      entitiesWithNameResolver: [],
    };

    // Inject the refContext into the parent's common context and parse the inner type.
    const parseOutput = this._def.innerType._parse({
      ...input,
      parent: {
        ...input.parent,
        common: {
          ...input.parent.common,
          [zodRefSymbol]: refContext,
        },
      } as ParseContext,
    });

    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<ZodRefPayload<TypeOf<T>>> {
      if (output.status === 'aborted') return output;

      return {
        ...output,
        value: {
          data: output.value,
          entitiesWithNameResolver: refContext.entitiesWithNameResolver,
          references: refContext.references,
        },
      };
    }

    if (isPromise(parseOutput)) {
      return parseOutput.then(transformParseOutput);
    }

    return transformParseOutput(parseOutput);
  }

  /**
   * Creates a new ZodRefWrapper instance.
   * @param type - The inner Zod type.
   * @param options - Options for the ZodRefWrapper.
   * @param options.skipReferenceNameResolution - Flag to skip resolving references to names (serialized definitions use resolved name references).
   * @param options.allowInvalidReferences - Flag to allow invalid references (used for testing deletes).
   * @returns A new instance of ZodRefWrapper.
   */
  static create = <T extends ZodTypeAny>(type: T): ZodRefWrapper<T> =>
    new ZodRefWrapper<T>({
      innerType: type,
    });
}
