import _ from 'lodash';
import {
  ParseContext,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
  TypeOf,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  input,
  z,
} from 'zod';

import {
  DefinitionEntity,
  DefinitionEntityType,
  DefinitionReference,
  ReferencePath,
} from './types.js';
import { FieldPath, FieldValues } from '@src/types/path/eager.js';

export const zRefId = z.string().min(1).optional();

function isPromise(object: unknown): object is Promise<unknown> {
  return object instanceof Promise;
}

/**
 * Builder for references
 */

type PathInput<Type> = Type extends FieldValues ? FieldPath<Type> : never;

interface ContextValue {
  context: string;
}

type PathInputOrContext<Type> = PathInput<Type> | ContextValue;

/**
 * Definition Entity Input
 */
interface DefinitionEntityInputBase<
  TInput,
  TEntityType extends DefinitionEntityType,
  TIdKey = 'id',
> {
  type: TEntityType;
  path?: PathInput<TInput>;
  idPath?: TIdKey;
  namePath?: PathInput<TInput>;
  name?: string;
  addContext?: string;
  stripIdWhenSerializing?: boolean;
}

interface DefinitionEntityInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TIDKey> {
  parentPath: PathInputOrContext<TInput>;
}

interface DefinitionEntityInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
  TIDKey extends string = 'id',
> extends DefinitionEntityInputBase<TInput, TEntityType, TIDKey> {
  parentPath?: never;
}

type DefinitionEntityInput<
  TInput,
  TEntityType extends DefinitionEntityType,
  TIDKey extends string = 'id',
> = TEntityType['parentType'] extends undefined
  ? DefinitionEntityInputWithoutParent<TInput, TEntityType, TIDKey>
  : DefinitionEntityInputWithParent<TInput, TEntityType, TIDKey>;

/**
 * Definition Reference Input
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

/**
 * Zod RefBuilder: Used for creating references for zod
 */

interface RefBuilderContext {
  pathMap: Record<string, { path: ReferencePath; type: DefinitionEntityType }>;
  deserialize: boolean;
}

class ZodRefBuilder<TInput> {
  references: DefinitionReference[];
  entities: DefinitionEntity[];
  pathPrefix: ReferencePath;
  context: RefBuilderContext;
  pathMap: Record<string, { path: ReferencePath; type: DefinitionEntityType }>;
  data: TInput;

  constructor(
    pathPrefix: ReferencePath,
    context: RefBuilderContext,
    data: TInput,
  ) {
    this.references = [];
    this.entities = [];
    this.pathPrefix = pathPrefix;
    this.context = context;
    this.pathMap = {};
    this.data = data;
  }

  _constructPathWithoutPrefix(
    path: PathInput<TInput> | undefined,
  ): ReferencePath {
    if (!path) return [];

    const pathComponents = path
      .split('.')
      .map((key) => (/^[0-9]+$/.test(key) ? parseInt(key, 10) : key));

    return pathComponents;
  }

  _constructPath(path: PathInput<TInput> | undefined): ReferencePath {
    if (!path) return this.pathPrefix;

    return [...this.pathPrefix, ...this._constructPathWithoutPrefix(path)];
  }

  _constructPathWithContext(
    path: PathInputOrContext<TInput>,
    expectedEntityType: DefinitionEntityType,
  ): ReferencePath {
    if (typeof path === 'string') {
      return this._constructPath(path);
    }
    const pathContext = this.context.pathMap[path.context];
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

    // check reference exists, otherwise don't add reference
    const refPathWithoutPrefix = this._constructPathWithoutPrefix(
      reference.path,
    );
    const refValue =
      refPathWithoutPrefix.length === 0
        ? this.data
        : (_.get(
            this.data,
            this._constructPathWithoutPrefix(reference.path),
          ) as string);
    if (refValue === undefined || refValue === null) return;

    const path = this._constructPath(reference.path);

    this.references.push({
      type: reference.type,
      path: path,
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

  addEntity<
    TEntityType extends DefinitionEntityType,
    TIDKey extends string | PathInput<TInput> = 'id',
  >(entity: DefinitionEntityInput<TInput, TEntityType, TIDKey>): void {
    const path = this._constructPath(entity.path);

    // attempt to fetch id from entity input
    const idPath = entity.idPath
      ? this._constructPathWithoutPrefix(entity.idPath as PathInput<TInput>)
      : [...this._constructPathWithoutPrefix(entity.path), 'id'];
    const id =
      (_.get(this.data, idPath) as string) ?? entity.type.generateNewId();

    // attempt to fetch name from entity input
    const name =
      entity.name ??
      (_.get(
        this.data,
        entity.namePath ?? [...(entity.path ?? []), 'name'],
      ) as string);

    if (!name) {
      throw new Error(`Reference entity requires a name at ${path.join('.')}`);
    }

    this.entities.push({
      id,
      type: entity.type,
      name,
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
    });

    if (entity.addContext) {
      this._addPathToContext(
        [...this.pathPrefix, ...idPath],
        entity.type,
        entity.addContext,
      );
    }
  }

  _addPathToContext(
    path: ReferencePath,
    type: DefinitionEntityType,
    context: string,
  ): void {
    if (this.pathMap[context]) {
      throw new Error(
        `Context path already defined for ${context} at ${this.pathPrefix.join(
          '.',
        )}`,
      );
    }
    this.pathMap[context] = {
      path,
      type,
    };
  }

  addPathToContext(
    path: PathInput<TInput>,
    type: DefinitionEntityType,
    context: string,
  ): void {
    this._addPathToContext(this._constructPath(path), type, context);
  }
}

type ZodBuilderFunction<Input> = (
  builder: ZodRefBuilder<Input>,
  data: Input,
) => void;

export interface ZodRefDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  builder?: ZodBuilderFunction<input<T>>;
}

const zodRefSymbol = Symbol('zod-ref');

interface ZodRefContext {
  context: RefBuilderContext;
  references: DefinitionReference[];
  entities: DefinitionEntity[];
}

interface ExtendedCommonContext {
  [zodRefSymbol]?: ZodRefContext;
}

export class ZodRef<T extends ZodTypeAny> extends ZodType<
  TypeOf<T>,
  ZodRefDef<T>,
  input<T>
> {
  _parse(input: ParseInput): ParseReturnType<TypeOf<T>> {
    const context = input.parent.common as ExtendedCommonContext;
    // run builder
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
              pathMap: {
                ...zodRefContext.context.pathMap,
                ...builder.pathMap,
              },
            },
          },
        },
      } as ParseContext,
    });

    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<unknown> {
      if (output.status === 'aborted') return output;

      // replace IDs in parse output
      if (builder.entities.length) {
        builder.entities.forEach((entity) => {
          _.set(
            output.value as object,
            entity.idPath.slice(input.path.length),
            entity.id,
          );
        });
      }
      return output;
    }

    if (isPromise(parseOutput)) {
      return parseOutput.then(transformParseOutput);
    }

    return transformParseOutput(parseOutput);
  }

  static create = <T extends ZodTypeAny>(
    type: T,
    builder?: ZodBuilderFunction<TypeOf<T>>,
  ): ZodRef<T> => {
    return new ZodRef<T>({
      innerType: type,
      builder,
    });
  };

  addEntity<
    TEntityType extends DefinitionEntityType,
    TIDKey extends string = 'id',
  >(
    entity:
      | DefinitionEntityInput<input<T>, TEntityType, TIDKey>
      | ((
          data: input<T>,
        ) => DefinitionEntityInput<input<T>, TEntityType, TIDKey>),
  ): ZodRef<T> {
    return ZodRef.create(this, (builder, data) => {
      builder.addEntity(typeof entity === 'function' ? entity(data) : entity);
    }) as unknown as ZodRef<T>;
  }

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

  refBuilder(builder: ZodBuilderFunction<T>): ZodRef<T> {
    return ZodRef.create(this, builder) as unknown as ZodRef<T>;
  }
}

export function zRefBuilder<T extends z.ZodType>(
  schema: T,
  builder?: ZodBuilderFunction<TypeOf<T>>,
): ZodRef<T> {
  return ZodRef.create(schema, builder);
}

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

export function zEnt<
  TObject extends z.SomeZodObject,
  TEntityType extends DefinitionEntityType,
>(
  schema: TObject,
  entity:
    | DefinitionEntityInput<z.input<TObject>, TEntityType, 'id'>
    | ((
        data: z.input<TObject>,
      ) => DefinitionEntityInput<z.input<TObject>, TEntityType, 'id'>),
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
 * Zod Ref Wrapper
 *
 * Used for initializing the zod parsing for gathering entities and references
 */

export interface ZodRefPayload<TData> {
  data: TData;
  references: DefinitionReference[];
  entities: DefinitionEntity[];
}

export interface ZodRefWrapperDef<T extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  innerType: T;
  deserialize: boolean;
}

export class ZodRefWrapper<T extends ZodTypeAny> extends ZodType<
  ZodRefPayload<TypeOf<T>>,
  ZodRefWrapperDef<T>,
  input<T>
> {
  _parse(input: ParseInput): ParseReturnType<ZodRefPayload<TypeOf<T>>> {
    // run builder
    const refContext: ZodRefContext = {
      context: {
        pathMap: {},
        deserialize: this._def.deserialize,
      },
      references: [],
      entities: [],
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

    function transformParseOutput(
      output: SyncParseReturnType<unknown>,
    ): SyncParseReturnType<ZodRefPayload<TypeOf<T>>> {
      if (output.status === 'aborted') return output;
      return {
        ...output,
        value: {
          data: output.value,
          entities: refContext.entities,
          references: refContext.references,
        },
      };
    }

    if (isPromise(parseOutput)) {
      return parseOutput.then(transformParseOutput);
    }

    return transformParseOutput(parseOutput);
  }

  static create = <T extends ZodTypeAny>(
    type: T,
    deserialize = false,
  ): ZodRefWrapper<T> => {
    return new ZodRefWrapper<T>({
      innerType: type,
      deserialize,
    });
  };
}
