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

import { pull } from 'es-toolkit';
import { get, set } from 'es-toolkit/compat';
import { z, ZodType } from 'zod';

import type {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
  ReferencePath,
} from './types.js';

/**
 * Zod reference ID schema (optional string with minimum length 1)
 */
export const zRefId = z.string().min(1).optional();

/**
 * Checks if the given object is a Promise.
 * @param object - The object to check.
 * @returns True if the object is a Promise, false otherwise.
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
 * Base input definition for a reference entity.
 * @template TInput - The input type.
 * @template TEntityType - The entity type.
 * @template TPath - The path type (optional).
 * @template TIdKey - The key for the ID property.
 */
interface DefinitionEntityInputBase<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIdKey = 'id',
> {
  type: TEntityType;
  path?: TPath;
  idPath?: TIdKey;
  namePath?: PathInput<TInput>;
  /**
   * Use name ref path when the path that contains the name is a ref.
   */
  nameRefPath?: PathInput<TInput>;
  name?: string;
  addContext?: string;
  stripIdWhenSerializing?: boolean;
}

interface DefinitionEntityInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TPath, TIDKey> {
  parentPath: PathInputOrContext<TInput>;
}

interface DefinitionEntityInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TPath, TIDKey> {
  parentPath?: never;
}

type DefinitionEntityInput<
  TInput,
  TEntityType extends DefinitionEntityType,
  TPath extends PathInput<TInput> | undefined = undefined,
  TIDKey extends string = 'id',
> = TEntityType['parentType'] extends undefined
  ? DefinitionEntityInputWithoutParent<TInput, TEntityType, TPath, TIDKey>
  : DefinitionEntityInputWithParent<TInput, TEntityType, TPath, TIDKey>;

/**
 * Base input definition for a reference.
 * @template TInput - The input type.
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

type DefinitionReferenceInput<
  TInput,
  TEntityType extends DefinitionEntityType,
> = TEntityType['parentType'] extends undefined
  ? DefinitionReferenceInputWithoutParent<TInput, TEntityType>
  : DefinitionReferenceInputWithParent<TInput, TEntityType>;

interface DefinitionEntityWithNamePath extends Omit<DefinitionEntity, 'name'> {
  nameRefPath: ReferencePath;
}

interface RefBuilderContext {
  pathMap: Map<string, { path: ReferencePath; type: DefinitionEntityType }>;
  deserialize: boolean;
}

/**
 * Class for building references and entities for a Zod schema.
 * @template TInput - The type of the input data.
 */
export class ZodRefBuilder<TInput> {
  readonly references: DefinitionReference[];
  readonly entities: DefinitionEntity[];
  readonly entitiesWithNamePath: DefinitionEntityWithNamePath[];
  readonly pathPrefix: ReferencePath;
  readonly context: RefBuilderContext;
  readonly pathMap: Map<
    string,
    { path: ReferencePath; type: DefinitionEntityType }
  >;
  readonly data: TInput;

  /**
   * Creates an instance of ZodRefBuilder.
   * @param pathPrefix - The prefix for reference paths.
   * @param context - The builder context.
   * @param data - The input data.
   */
  constructor(
    pathPrefix: ReferencePath,
    context: RefBuilderContext,
    data: TInput,
  ) {
    this.references = [];
    this.entities = [];
    this.entitiesWithNamePath = [];
    this.pathPrefix = pathPrefix;
    this.context = context;
    this.pathMap = new Map();
    this.data = data;
  }

  /**
   * Constructs a reference path without the prefix.
   * @param path - The dot-separated string path.
   * @returns The constructed reference path as an array.
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
   * Constructs a full reference path by combining the prefix and the provided path.
   * @param path - The dot-separated string path.
   * @returns The full reference path as an array.
   */
  protected _constructPath(path: PathInput<TInput> | undefined): ReferencePath {
    if (!path) return this.pathPrefix;

    return [...this.pathPrefix, ...this._constructPathWithoutPrefix(path)];
  }

  /**
   * Constructs a reference path using either a string path or a context value.
   * @param path - The path as a string or a context object.
   * @param expectedEntityType - The expected entity type for the context.
   * @returns The constructed reference path.
   * @throws Error if the context is not found or does not match the expected type.
   */
  protected _constructPathWithContext(
    path: PathInputOrContext<TInput>,
    expectedEntityType: DefinitionEntityType,
  ): ReferencePath {
    if (typeof path === 'string') {
      return this._constructPath(path);
    }
    const pathContext = this.context.pathMap.get(path.context);
    if (!pathContext) {
      throw new Error(
        `Could not find context for ${path.context} from ${this.pathPrefix.join(
          '.',
        )}`,
      );
    }
    if (pathContext.type !== expectedEntityType) {
      throw new Error(
        `Attempted retreive context for ${
          path.context
        } from ${this.pathPrefix.join('.')} expecting ${
          expectedEntityType.name
        }, but found ${pathContext.type.name}`,
      );
    }

    return pathContext.path;
  }

  /**
   * Adds a reference based on the provided input.
   * @param reference - The reference input object.
   * @throws Error if parent path requirements are not met.
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

    // Check reference exists, otherwise do not add reference.
    const refPathWithoutPrefix = this._constructPathWithoutPrefix(
      reference.path,
    );
    const refValue =
      refPathWithoutPrefix.length === 0
        ? this.data
        : (get(
            this.data,
            this._constructPathWithoutPrefix(reference.path),
          ) as string);
    if (refValue === undefined || refValue === null) return;

    const path = this._constructPath(reference.path);

    this.references.push({
      type: reference.type,
      path,
      parentPath:
        reference.parentPath &&
        reference.type.parentType &&
        this._constructPathWithContext(
          reference.parentPath,
          reference.type.parentType,
        ),
      onDelete: reference.onDelete,
    });

    if (reference.addContext) {
      this._addPathToContext(path, reference.type, reference.addContext);
    }
  }

  /**
   * Adds an entity based on the provided input.
   * @param entity - The entity input object.
   * @throws Error if both name and nameRefPath are provided or if a name is missing.
   */
  addEntity<
    TEntityType extends DefinitionEntityType,
    TPath extends PathInput<TInput> | undefined = undefined,
    TIDKey extends string | PathInput<TInput> = 'id',
  >(entity: DefinitionEntityInput<TInput, TEntityType, TPath, TIDKey>): void {
    if ((!!entity.name || !!entity.namePath) && entity.nameRefPath) {
      throw new Error(
        `Reference entity cannot have both name and nameRefPath at ${entity.path}`,
      );
    }

    const path = this._constructPath(entity.path);

    // Attempt to fetch id from entity input.
    const idPath = entity.idPath
      ? this._constructPathWithoutPrefix(entity.idPath as PathInput<TInput>)
      : [...this._constructPathWithoutPrefix(entity.path), 'id'];
    const id =
      (get(this.data, idPath) as string | undefined) ??
      entity.type.generateNewId();

    // Attempt to fetch name from entity input.
    const name =
      entity.name ??
      (get(
        this.data,
        entity.namePath ?? [
          ...((entity.path as PathInput<TInput> | undefined) ?? []),
          'name',
        ],
      ) as string);

    if (!name && !entity.nameRefPath) {
      throw new Error(`Reference entity requires a name at ${path.join('.')}`);
    }

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
      stripIdWhenSerializing: entity.stripIdWhenSerializing,
    };

    if (entity.nameRefPath) {
      this.entitiesWithNamePath.push({
        ...entityBase,
        nameRefPath: this._constructPath(entity.nameRefPath),
      });
    } else {
      this.entities.push({
        ...entityBase,
        name,
      });
    }

    if (entity.addContext) {
      this._addPathToContext(
        [...this.pathPrefix, ...idPath],
        entity.type,
        entity.addContext,
      );
    }
  }

  /**
   * Adds a constructed path to the context map.
   * @param path - The reference path.
   * @param type - The entity type.
   * @param context - The context key.
   * @throws Error if the context is already defined.
   */
  _addPathToContext(
    path: ReferencePath,
    type: DefinitionEntityType,
    context: string,
  ): void {
    if (this.pathMap.has(context)) {
      throw new Error(
        `Context path already defined for ${context} at ${this.pathPrefix.join(
          '.',
        )}`,
      );
    }
    this.pathMap.set(context, {
      path,
      type,
    });
  }

  /**
   * Constructs a path from input and adds it to the context map.
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
 * Function type for building references and entities.
 * @template Input - The input data type.
 */
type ZodBuilderFunction<Input> = (
  builder: ZodRefBuilder<Input>,
  data: Input,
) => void;

/**
 * Definition for a ZodRef, wrapping an inner Zod type with an optional builder function.
 * @template T - The inner Zod type.
 */
export interface ZodRefDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  builder?: ZodBuilderFunction<input<T>>;
}

/**
 * Unique symbol used to store ZodRef context in the parser's common context.
 */
const zodRefSymbol = Symbol('zod-ref');

/**
 * Context object for holding references, entities, and builder context.
 */
interface ZodRefContext {
  context: RefBuilderContext;
  references: DefinitionReference[];
  entities: DefinitionEntity[];
  entitiesWithNamePath: DefinitionEntityWithNamePath[];
}

/**
 * Extended context that may include ZodRef context.
 */
interface ExtendedCommonContext {
  [zodRefSymbol]?: ZodRefContext;
}

/**
 * Wrapper around a Zod type that adds reference and entity building capabilities.
 * @template T - The inner Zod type.
 */
export class ZodRef<T extends ZodTypeAny> extends ZodType<
  TypeOf<T>,
  ZodRefDef<T>,
  input<T>
> {
  /**
   * Parses the input, processing references and entities using the builder.
   * @param input - The parsing input.
   * @returns The parsed output.
   */
  _parse(input: ParseInput): ParseReturnType<TypeOf<T>> {
    const context = input.parent.common as ExtendedCommonContext;
    // Run builder if available.
    const zodRefContext = context[zodRefSymbol];
    if (!zodRefContext || !this._def.builder) {
      return this._def.innerType._parse(input);
    }
    const builder = new ZodRefBuilder<input<T>>(
      input.path,
      zodRefContext.context,
      input.data as input<T>,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this._def.builder(builder, input.data);
    zodRefContext.references.push(...builder.references);
    zodRefContext.entities.push(...builder.entities);
    zodRefContext.entitiesWithNamePath.push(...builder.entitiesWithNamePath);

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
     * Transforms the parse output by replacing IDs in the output value.
     * @param output - The parse output.
     * @returns The transformed parse output.
     */
    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<unknown> {
      if (output.status === 'aborted') return output;

      // Replace IDs in parse output.
      const allEntities = [
        ...builder.entities,
        ...builder.entitiesWithNamePath,
      ];
      if (allEntities.length > 0) {
        for (const entity of allEntities) {
          set(
            output.value as object,
            entity.idPath.slice(input.path.length),
            entity.id,
          );
        }
      }
      return output;
    }

    if (isPromise(parseOutput)) {
      return parseOutput.then(transformParseOutput);
    }

    return transformParseOutput(parseOutput);
  }

  /**
   * Returns the inner Zod type.
   * @returns The inner Zod type.
   */
  innerType(): T {
    return this._def.innerType;
  }

  /**
   * Adds an entity to the ZodRef schema.
   * @param entity - The entity input object or a function returning the entity input.
   * @returns The updated ZodRef instance.
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
   * Adds a reference to the ZodRef schema.
   * @param reference - The reference input object or a function returning the reference input.
   * @returns The updated ZodRef instance.
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
   * Applies a builder function to the ZodRef schema.
   * @param builder - The builder function.
   * @returns The updated ZodRef instance.
   */
  refBuilder(builder: ZodBuilderFunction<input<T>>): ZodRef<T> {
    return ZodRef.create(this, builder) as unknown as ZodRef<T>;
  }

  /**
   * Creates a new ZodRef instance wrapping the given Zod type with an optional builder.
   * @param type - The inner Zod type.
   * @param builder - Optional builder function.
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
 * Creates a ZodRef instance using the given schema and optional builder.
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
 * Creates a ZodRef instance and adds a reference based on the provided schema and reference input.
 * @param schema - The base Zod schema.
 * @param reference - The reference input object or a function returning it.
 * @returns A new ZodRef instance with the reference added.
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
 * Creates a ZodRef instance for an entity, adding an entity definition to the schema.
 * @template TObject - The Zod object type.
 * @template TEntityType - The entity type.
 * @template TPath - The path type.
 * @param schema - The base Zod object schema.
 * @param entity - The entity input object or a function returning it.
 * @returns A new ZodRef instance with the entity added.
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
      id: z.ZodType<string, z.ZodAnyDef, string | undefined>;
    },
    TObject['_def']['unknownKeys'],
    TObject['_def']['catchall']
  >
> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return ZodRef.create(schema.setKey('id', zRefId)).addEntity(entity) as any;
}

/**
 * Payload returned after parsing, containing the data, references, and entities.
 * @template TData - The type of the parsed data.
 */
export interface ZodRefPayload<TData> {
  data: TData;
  references: DefinitionReference[];
  entities: DefinitionEntity[];
}

/**
 * Definition for a ZodRefWrapper, including inner type and deserialization options.
 * @template T - The inner Zod type.
 */
export interface ZodRefWrapperDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  deserialize: boolean;
  /**
   * Whether to allow missing name references. Useful for testing deletions.
   */
  allowMissingNameRefs?: boolean;
}

/**
 * Wrapper for initializing Zod parsing that gathers references and entities, optionally deserializing.
 * @template T - The inner Zod type.
 */
export class ZodRefWrapper<T extends ZodTypeAny> extends ZodType<
  ZodRefPayload<TypeOf<T>>,
  ZodRefWrapperDef<T>,
  input<T>
> {
  /**
   * Parses the input using the inner type, processing and resolving references and entities.
   * @param input - The parsing input.
   * @returns The parsed payload containing data, references, and entities.
   */
  _parse(input: ParseInput): ParseReturnType<ZodRefPayload<TypeOf<T>>> {
    // Run builder.
    const shouldDeserialize = this._def.deserialize;
    const allowMissingNameRefs = this._def.allowMissingNameRefs ?? false;
    const refContext: ZodRefContext = {
      context: {
        pathMap: new Map(),
        deserialize: shouldDeserialize,
      },
      references: [],
      entities: [],
      entitiesWithNamePath: [],
    };

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

    /**
     * Transforms the parse output by resolving entities with name references.
     * @param output - The parse output.
     * @returns The transformed parse output with data, entities, and references.
     */
    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<ZodRefPayload<TypeOf<T>>> {
      if (output.status === 'aborted') return output;

      // Resolve entities with name paths if not deserializing.
      const entities = [...refContext.entities];

      if (refContext.entitiesWithNamePath.length > 0) {
        const entitiesById = new Map<string, DefinitionEntity>(
          entities.map((entity) => [entity.id, entity]),
        );
        let entitiesLength = -1;
        do {
          if (entitiesLength === entities.length) {
            if (allowMissingNameRefs) {
              break;
            }
            throw new Error(
              `Could not resolve all entities with name paths. Entities remaining: ${refContext.entitiesWithNamePath
                .map((e) => e.id)
                .join(', ')}`,
            );
          }
          entitiesLength = entities.length;
          const entitiesWithNamePath = [...refContext.entitiesWithNamePath];
          for (const entity of entitiesWithNamePath) {
            const newName = (() => {
              const { nameRefPath } = entity;
              const nameRefValue = get(output.value, nameRefPath) as
                | string
                | undefined;
              if (nameRefValue === undefined) {
                throw new Error(
                  `Could not find name ref value at ${nameRefPath.join('.')}`,
                );
              }
              // If deserializing, return the name ref value.
              if (shouldDeserialize) {
                return nameRefValue;
              }
              const refEntity = entitiesById.get(nameRefValue);
              if (!refEntity) {
                throw new Error(
                  `Could not find entity with id ${nameRefValue} at ${nameRefPath.join('.')}`,
                );
              }
              return refEntity.name;
            })();
            if (newName) {
              const newEntity = {
                ...entity,
                name: newName,
              };
              entities.push(newEntity);
              entitiesById.set(entity.id, newEntity);
              pull(refContext.entitiesWithNamePath, [entity]);
            }
          }
        } while (refContext.entitiesWithNamePath.length > 0);
      }

      return {
        ...output,
        value: {
          data: output.value,
          entities,
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
   * Creates a new ZodRefWrapper instance with the given inner type and deserialization options.
   * @param type - The inner Zod type.
   * @param deserialize - Whether to deserialize name references.
   * @param allowMissingNameRefs - Whether to allow missing name references.
   * @returns A new ZodRefWrapper instance.
   */
  static create = <T extends ZodTypeAny>(
    type: T,
    deserialize = false,
    allowMissingNameRefs = false,
  ): ZodRefWrapper<T> =>
    new ZodRefWrapper<T>({
      innerType: type,
      deserialize,
      allowMissingNameRefs,
    });
}
