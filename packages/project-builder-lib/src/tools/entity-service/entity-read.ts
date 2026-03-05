import { isPlainObject } from 'es-toolkit';
import { get } from 'es-toolkit/compat';

import type { EntityServiceContext } from './types.js';

import { getEntityName } from '../merge-schema/entity-utils.js';
import { resolveEntityArray } from './entity-navigation.js';

export interface ListEntitiesInput {
  entityTypeName: string;
  parentEntityId?: string;
}

/**
 * Lightweight entity stub returned by listEntities.
 */
export interface EntityStub {
  id: string;
  name: string;
  type: string;
}

/**
 * Lists all entities of a given type, returning lightweight stubs.
 *
 * For nested entity types, `parentEntityId` is required to scope the listing
 * to entities within a specific parent.
 *
 * @param container - The project definition container
 * @param entityTypeMap - The entity type map built from the schema
 * @param entityTypeName - The entity type to list
 * @param parentEntityId - Required for nested entity types
 * @returns Array of entity stubs with id, name, and type
 */
export function listEntities(
  { entityTypeName, parentEntityId }: ListEntitiesInput,
  context: EntityServiceContext,
): EntityStub[] {
  const metadata = context.entityTypeMap.get(entityTypeName);
  if (!metadata) {
    throw new Error(`Unknown entity type: ${entityTypeName}`);
  }

  const { array, path } = resolveEntityArray(
    entityTypeName,
    parentEntityId,
    context,
  );

  return array.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new TypeError(
        `Expected plain object at path "${path.join('.')}[${index}]" but got ${typeof item}`,
      );
    }
    const id = get(item, metadata.entityMeta.idPath) as unknown;
    if (typeof id !== 'string') {
      throw new TypeError(
        `Expected string id at path "${metadata.entityMeta.idPath.join('.')}" but got ${typeof id}`,
      );
    }
    const name = getEntityName(metadata.entityMeta, item);
    return { id, name, type: entityTypeName };
  });
}

/**
 * Gets a single entity by ID, returning its full serialized (name-based) data.
 *
 * @param container - The project definition container
 * @param entityTypeMap - The entity type map built from the schema
 * @param serializedDef - The serialized project definition (with names)
 * @param entityTypeName - The entity type to get
 * @param entityId - The entity ID
 * @returns The serialized entity data, or undefined if not found
 */
export function getEntity(
  entityId: string,
  context: EntityServiceContext,
): Record<string, unknown> | undefined {
  const result = context.lookupEntity(entityId);
  if (!result) {
    return undefined;
  }
  const item = get(context.serializedDefinition, result.path) as unknown;
  if (!isPlainObject(item)) {
    throw new TypeError(
      `Expected plain object at path "${result.path.join('.')}" but got ${typeof item}`,
    );
  }
  return item;
}
