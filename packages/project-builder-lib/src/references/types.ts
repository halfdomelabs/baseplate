import { randomUid } from '@src/utils/randomUid.js';

export type ReferencePath = (string | number)[];

/**
 * Definition of an entity type.
 */
export class DefinitionEntityType<THasParent extends boolean = boolean> {
  /**
   * Creates a new entity type.
   *
   * @param name - The name of the entity type.
   * @param prefix - The prefix of the entity type to use in the ID, defaults to the name.
   * @param parentType - The type of the parent entity if any
   */
  constructor(
    public readonly name: string,
    public readonly prefix?: string,
    public readonly parentType?: THasParent extends true
      ? DefinitionEntityType
      : undefined,
  ) {}

  /**
   * Generates a new ID for the entity type.
   *
   * @returns The new ID.
   */
  generateNewId(): string {
    return `${this.prefix ?? this.name}:${randomUid()}`;
  }

  /**
   * Converts a UID to an ID.
   *
   * @param uid - The UID to convert.
   * @returns The ID.
   */
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

  isId(id: string): boolean {
    return id.startsWith(`${this.prefix ?? this.name}:`);
  }
}

/**
 * An entity in the project definition, e.g. a model, enum, or field.
 */
export interface DefinitionEntity {
  /**
   * The ID of the entity.
   */
  id: string;
  /**
   * The name of the entity.
   */
  name: string;
  /**
   * The type of the entity.
   */
  type: DefinitionEntityType;
  /**
   * The path to the entity in the definition.
   */
  path: ReferencePath;
  /**
   * The path to the entity's ID.
   */
  idPath: ReferencePath;
  /**
   * The path to the entity's parent in the definition.
   */
  parentPath?: ReferencePath;
  /**
   * Strips the ID when serializing. Use this for entities where the ID
   * does not need to be persisted, e.g. there is no perma-link to the entity.
   *
   * Note: This will create a new ID every time the config is deserialized.
   */
  stripIdWhenSerializing?: boolean;
}

type ReferenceOnDeleteAction =
  /**
   * Set the reference to null.
   */
  | 'SET_NULL'
  /**
   * Delete the entity.
   */
  | 'DELETE'
  /**
   * Delete the parent entity.
   */
  | 'DELETE_PARENT'
  /**
   * Throw an error if the referenced entity is deleted.
   */
  | 'RESTRICT';

/**
 * A reference to an entity.
 */
export interface DefinitionReference {
  /**
   * The type of the entity.
   */
  type: DefinitionEntityType;
  /**
   * The path to the entity in the definition.
   */
  path: ReferencePath;
  /**
   * The path to the entity's parent in the definition.
   */
  parentPath?: ReferencePath;
  /**
   * The action to take when the referenced entity is deleted.
   */
  onDelete: ReferenceOnDeleteAction;
}

export function createEntityType(name: string): DefinitionEntityType<false>;

export function createEntityType<
  TParent extends DefinitionEntityType | undefined = undefined,
>(
  name: string,
  options: { parentType?: TParent; prefix?: string },
): DefinitionEntityType<TParent extends undefined ? false : true>;

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

/**
 * A payload with resolved entity names.
 *
 * @template T - The type of the payload.
 */
export interface ResolvedZodRefPayload<T> {
  /**
   * The parsed data.
   */
  data: T;
  /**
   * The entities with resolved names.
   */
  entities: DefinitionEntity[];
  /**
   * The references in the definition.
   */
  references: DefinitionReference[];
}
