import { nanoid } from 'nanoid';
import {
  ParseContext,
  ParseInput,
  ParseReturnType,
  TypeOf,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  input,
  z,
} from 'zod';

import { FieldPath, FieldValues } from '@src/types/path/eager.js';

/**
 * The references system for the project builder.
 */
export interface DefinitionEntityType<
  TParent extends DefinitionEntityType | undefined = undefined,
> {
  name: string;
  prefix?: string;
  parentType?: TParent;
}

export interface DefinitionEntity {
  id: string;
  type: DefinitionEntityType;
  path: Path;
  parentPath?: Path;
}

type OnDeleteAction = 'SET_NULL' | 'CASCADE' | 'RESTRICT';

export interface DefinitionReference {
  type: DefinitionEntityType;
  path: Path;
  parentPath?: Path;
  onDelete: OnDeleteAction;
}

export function createEntityType(name: string): DefinitionEntityType<undefined>;

export function createEntityType<TParent extends DefinitionEntityType>(
  name: string,
  options?: { parentType: TParent },
): DefinitionEntityType<TParent> {
  const { parentType } = options ?? {};
  return {
    name,
    parentType,
  };
}

type Path = (string | number)[];

type PathInput<Type> = Type extends FieldValues ? FieldPath<Type> : never;

interface ContextValue {
  context: string;
}

type PathInputOrContext<Type> = PathInput<Type> | ContextValue;

interface DefinitionReferenceInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> {
  type: TEntityType;
  path: PathInput<TInput>;
  parentPath: PathInputOrContext<TInput>;
  onDelete: OnDeleteAction;
}

interface DefinitionReferenceInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> {
  type: TEntityType;
  path: PathInput<TInput>;
  parentPath?: never;
  onDelete: OnDeleteAction;
}

type DefinitionReferenceInput<
  TInput,
  TEntityType extends DefinitionEntityType,
> = TEntityType['parentType'] extends undefined
  ? DefinitionReferenceInputWithoutParent<TInput, TEntityType>
  : DefinitionReferenceInputWithParent<TInput, TEntityType>;

interface DefinitionEntityInputWithParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> {
  type: TEntityType;
  path: PathInput<TInput>;
  parentPath: PathInputOrContext<TInput>;
  onDelete: OnDeleteAction;
}

interface DefinitionEntityInputWithoutParent<
  TInput,
  TEntityType extends DefinitionEntityType,
> {
  type: TEntityType;
  path: PathInput<TInput>;
  parentPath?: never;
  onDelete: OnDeleteAction;
}

type DefinitionEntityInput<
  TInput,
  TEntityType extends DefinitionEntityType,
> = TEntityType['parentType'] extends undefined
  ? DefinitionEntityInputWithoutParent<TInput, TEntityType>
  : DefinitionEntityInputWithParent<TInput, TEntityType>;

interface RefBuilderContext {
  pathMap: Record<string, { path: Path; type: DefinitionEntityType }>;
}

class ZodRefBuilder<TInput> {
  references: DefinitionReference[];
  entities: DefinitionEntity[];
  pathPrefix: Path;
  context: RefBuilderContext;
  pathMap: Record<string, { path: Path; type: DefinitionEntityType }>;

  constructor(pathPrefix: Path, context: RefBuilderContext) {
    this.references = [];
    this.entities = [];
    this.pathPrefix = pathPrefix;
    this.context = context;
    this.pathMap = {};
  }

  _constructPath(path: PathInput<TInput>): Path {
    const pathComponents = path
      .split('.')
      .map((key) => (/^[0-9]+$/.test(key) ? parseInt(key, 10) : key));

    return [...this.pathPrefix, ...pathComponents];
  }

  _constructPathWithContext(
    path: PathInputOrContext<TInput>,
    expectedEntityType: DefinitionEntityType,
  ): Path {
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
    const generatedId = nanoid();
    const prefix = entity.type.prefix ?? entity.type.name;
    this.entities.push({
      id: `${prefix}_${generatedId}`,
      type: entity.type,
      path: this._constructPath(entity.path),
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
  builder: ZodBuilderFunction<input<T>>;
}

const zodRefSymbol = Symbol('zod-ref');

interface ExtendedCommonContext {
  [zodRefSymbol]?: {
    context: RefBuilderContext;
    references: DefinitionReference[];
    entities: DefinitionEntity[];
  };
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
    if (!zodRefContext) {
      return this._def.innerType._parse(input);
    }
    const builder = new ZodRefBuilder<input<T>>(
      input.path,
      zodRefContext.context,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this._def.builder(input.data, builder);
    zodRefContext.references.push(...builder.references);
    zodRefContext.entities.push(...builder.entities);

    const parseOutput = this._def.innerType._parse({
      ...input,
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
    builder: ZodBuilderFunction<TypeOf<T>>,
  ): ZodRef<T> => {
    return new ZodRef<T>({
      innerType: type,
      builder,
    });
  };
}

export function zRefBuilder<T extends z.ZodType>(
  schema: T,
  builder: ZodBuilderFunction<TypeOf<T>>,
): ZodRef<T> {
  return ZodRef.create(schema, builder);
}
