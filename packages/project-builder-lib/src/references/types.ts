import { randomKey } from '@baseplate-dev/utils';

import type { DefinitionExpression } from './expression-types.js';

export type ReferencePath = (string | number)[];

/**
 * Definition of an entity type.
 */
export class DefinitionEntityType<THasParent extends boolean = boolean> {
  public readonly prefix: string;
  public readonly name: string;
  public readonly parentType?: THasParent extends true
    ? DefinitionEntityType
    : undefined;

  /**
   * Creates a new entity type.
   *
   * @param name - The name of the entity type.
   * @param prefix - The prefix of the entity type to use in the ID, defaults to the name.
   * @param parentType - The type of the parent entity if any
   */
  constructor(
    name: string,
    prefix?: string,
    parentType?: THasParent extends true ? DefinitionEntityType : undefined,
  ) {
    this.name = name;
    this.parentType = parentType;
    this.prefix = prefix ?? name.split('/').pop() ?? name;
  }

  /**
   * Generates a new ID for the entity type.
   *
   * @returns The new ID.
   */
  generateNewId(): string {
    return `${this.prefix}:${randomKey()}`;
  }

  /**
   * Converts a key to an ID.
   *
   * @param key - The key to convert.
   * @returns The ID.
   */
  idFromKey(key: string): string;
  idFromKey(key: string | undefined): string | undefined;
  idFromKey(key: string | undefined): string | undefined {
    if (!key) {
      return undefined;
    }
    return `${this.prefix}:${key}`;
  }

  keyFromId(id: string): string {
    return id.split(':')[1];
  }

  isId(id: string): boolean {
    return id.startsWith(`${this.prefix}:`);
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
   * The ID path of the entity.
   */
  idPath: ReferencePath;
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
   * The path to the entity's parent in the definition.
   */
  parentPath?: ReferencePath;
}

export type ReferenceOnDeleteAction =
  /**
   * Set the reference to undefined. Cannot be used for references inside arrays.
   */
  | 'SET_UNDEFINED'
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
  /**
   * The expressions in the definition.
   */
  expressions: DefinitionExpression[];
}
