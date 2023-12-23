import _ from 'lodash';
import { nanoid } from 'nanoid';
import { isPromise } from 'node:util/types';
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

export const zRefId = z.string().min(8).optional();

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
> {
  type: TEntityType;
  path?: PathInput<TInput>;
  namePath?: PathInput<TInput>;
  name?: string;
}

interface DefinitionEntityInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionEntityInputBase<TInput, TEntityType> {
  parentPath: PathInputOrContext<TInput>;
}

interface DefinitionEntityInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends DefinitionEntityInputBase<TInput, TEntityType> {
  parentPath?: never;
}

type DefinitionEntityInput<
  TInput,
  TEntityType extends DefinitionEntityType,
> = TEntityType['parentType'] extends undefined
  ? DefinitionEntityInputWithoutParent<TInput, TEntityType>
  : DefinitionEntityInputWithParent<TInput, TEntityType>;

/**
 * Definition Reference Input
 */

interface DefinitionReferenceInputBase<
  TInput,
  TEntityType extends DefinitionEntityType,
> extends Pick<DefinitionReference, 'onDelete'> {
  type: TEntityType;
  path?: PathInput<TInput>;
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

  _constructPath(path: PathInput<TInput> | undefined): ReferencePath {
    if (!path) return this.pathPrefix;

    const pathComponents = path
      .split('.')
      .map((key) => (/^[0-9]+$/.test(key) ? parseInt(key, 10) : key));

    return [...this.pathPrefix, ...pathComponents];
  }

  _constructPathWithContext(
    path: PathInputOrContext<TInput>,
    expectedEntityType: DefinitionEntityType,
  ): ReferencePath {
    if (typeof path === 'string') {
      return this._constructPath(path);
    }
    const pathContext = this.context.pathMap[path.context];
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

    this.references.push({
      type: reference.type,
      path: this._constructPath(reference.path),
      parentPath:
        reference.parentPath &&
        reference.type.parentType &&
        this._constructPathWithContext(
          reference.parentPath,
          reference.type.parentType,
        ),
      onDelete: reference.onDelete,
    });
  }

  addEntity<TEntityType extends DefinitionEntityType>(
    entity: DefinitionEntityInput<TInput, TEntityType>,
  ): void {
    const path = this._constructPath(entity.namePath);
    const generatedId = nanoid();
    const prefix = entity.type.prefix ?? entity.type.name;

    // attempt to fetch id from entity input
    const id =
      (_.get(this.data, [...(entity.path ?? []), 'id']) as string) ??
      `${prefix}_${generatedId}`;

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
      parentPath:
        entity.parentPath &&
        entity.type.parentType &&
        this._constructPathWithContext(
          entity.parentPath,
          entity.type.parentType,
        ),
    });
  }

  addPathToContext(path: PathInput<TInput>, type: DefinitionEntityType): void {
    this.pathMap[path] = {
      path: this._constructPath(path),
      type,
    };
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

    // replace IDs in input
    const inputData = builder.entities.length
      ? ((): unknown => {
          const copiedInputData = _.clone(input.data) as object;
          builder.entities.forEach((entity) => {
            _.set(
              copiedInputData,
              [...entity.path.slice(input.path.length), 'id'],
              entity.id,
            );
          });
          return copiedInputData;
        })()
      : (input.data as unknown);

    const parseOutput = this._def.innerType._parse({
      ...input,
      data: inputData,
      parent: {
        ...input.parent,
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
      } as ParseContext,
    });

    return parseOutput;
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

  addEntity<TEntityType extends DefinitionEntityType>(
    entity:
      | DefinitionEntityInput<T, TEntityType>
      | ((data: T) => DefinitionEntityInput<T, TEntityType>),
  ): ZodRef<T> {
    return ZodRef.create(this, (builder, data) => {
      builder.addEntity(typeof entity === 'function' ? entity(data) : entity);
    }) as unknown as ZodRef<T>;
  }

  addReference<TEntityType extends DefinitionEntityType>(
    reference:
      | DefinitionReferenceInput<T, TEntityType>
      | ((data: T) => DefinitionReferenceInput<T, TEntityType>),
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

export function zRef<T extends z.ZodType>(
  schema: T,
  builder?: ZodBuilderFunction<TypeOf<T>>,
): ZodRef<T> {
  return ZodRef.create(schema, builder);
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
    deserialize: boolean,
  ): ZodRefWrapper<T> => {
    return new ZodRefWrapper<T>({
      innerType: type,
      deserialize,
    });
  };
}
