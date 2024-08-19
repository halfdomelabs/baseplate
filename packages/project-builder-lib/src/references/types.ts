import { randomUid } from '@src/utils/randomUid.js';

export type ReferencePath = (string | number)[];

export class DefinitionEntityType<THasParent extends boolean = boolean> {
  constructor(
    public readonly name: string,
    public readonly prefix?: string,
    public readonly parentType?: THasParent extends true
      ? DefinitionEntityType
      : undefined,
  ) {}

  generateNewId(): string {
    return `${this.prefix ?? this.name}:${randomUid()}`;
  }

  fromUid(uid: string): string;
  fromUid(uid: string | undefined): string | undefined;
  fromUid(uid: string | undefined): string | undefined {
    if (!uid) {
      return undefined;
    }
    return `${this.prefix ?? this.name}:${uid}`;
  }

  toUid(id: string): string {
    return id.split(':')[1];
  }

  isUid(id: string): boolean {
    return id.startsWith(`${this.prefix ?? this.name}:`);
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
   *
   * Note: This will create a new ID every time the config is deserialized
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

export function createEntityType(name: string): DefinitionEntityType<false>;

export function createEntityType<TParent extends DefinitionEntityType>(
  name: string,
  options: { parentType?: TParent; prefix?: string },
): DefinitionEntityType<TParent extends DefinitionEntityType ? true : false>;

export function createEntityType<TParent extends DefinitionEntityType>(
  name: string,
  options?: { parentType?: TParent; prefix?: string },
): DefinitionEntityType<TParent extends DefinitionEntityType ? true : false> {
  const { parentType, prefix } = options ?? {};
  return new DefinitionEntityType(
    name,
    prefix,
    parentType as TParent extends DefinitionEntityType
      ? DefinitionEntityType
      : undefined,
  );
}
