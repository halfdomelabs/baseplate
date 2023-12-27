import { randomUid } from '@src/utils/randomUid.js';

export type ReferencePath = (string | number)[];

export class DefinitionEntityType<
  TParent extends DefinitionEntityType | undefined =
    | DefinitionEntityType<undefined>
    | undefined,
> {
  constructor(
    public readonly name: string,
    public readonly prefix?: string,
    public readonly parentType?: TParent,
  ) {}

  generateNewId(uid?: string): string {
    return `${this.prefix ?? this.name}:${uid ?? randomUid()}`;
  }

  getUidFromId(id: string): string {
    return id.split(':')[1];
  }
}

export interface DefinitionEntity {
  id: string;
  name: string;
  type: DefinitionEntityType;
  path: ReferencePath;
  idPath: ReferencePath;
  parentPath?: ReferencePath;
  /**
   * Strips the ID when deserializing
   */
  stripIdWhenSerializing?: boolean;
}

type ReferenceOnDeleteAction =
  | 'SET_NULL'
  | 'DELETE'
  | 'DELETE_PARENT'
  | 'RESTRICT';

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
  return new DefinitionEntityType(name, prefix, parentType);
}
