export type ReferencePath = (string | number)[];

export interface DefinitionEntityType<
  TParent extends DefinitionEntityType | undefined =
    | DefinitionEntityType<undefined>
    | undefined,
> {
  name: string;
  prefix?: string;
  parentType?: TParent;
}

export interface DefinitionEntity {
  id: string;
  name: string;
  type: DefinitionEntityType;
  path: ReferencePath;
  parentPath?: ReferencePath;
}

type ReferenceOnDeleteAction = 'SET_NULL' | 'CASCADE' | 'RESTRICT';

export interface DefinitionReference {
  type: DefinitionEntityType;
  path: ReferencePath;
  parentPath?: ReferencePath;
  onDelete: ReferenceOnDeleteAction;
}

export function createEntityType(name: string): DefinitionEntityType<undefined>;

export function createEntityType<TParent extends DefinitionEntityType>(
  name: string,
  options: { parentType?: TParent; prefix?: string },
): DefinitionEntityType<TParent>;

export function createEntityType<TParent extends DefinitionEntityType>(
  name: string,
  options?: { parentType?: TParent; prefix?: string },
): DefinitionEntityType<TParent> {
  const { parentType, prefix } = options ?? {};
  return {
    name,
    parentType,
    prefix,
  };
}
