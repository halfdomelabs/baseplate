import { isPlainObject } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { produce } from 'immer';

import type { EntityServiceContext } from './types.js';

import { assignEntityIds } from '../assign-entity-ids.js';
import { resolveEntityArray } from './entity-navigation.js';

export interface CreateEntityInput {
  entityTypeName: string;
  entityData: Record<string, unknown>;
  parentEntityId?: string;
}

/**
 * Creates a new entity in the definition.
 *
 * Generates a new ID for the entity using the entity type's ID generation.
 * For nested entity types, `parentEntityId` specifies which parent to add to.
 *
 * @returns A new definition with the entity added (original is not modified)
 */
export function createEntity(
  { entityTypeName, entityData, parentEntityId }: CreateEntityInput,
  context: EntityServiceContext,
): Record<string, unknown> {
  const metadata = context.entityTypeMap.get(entityTypeName);
  if (!metadata) {
    throw new Error(`Unknown entity type: ${entityTypeName}`);
  }

  // Resolve the array path on the original definition
  const { path } = resolveEntityArray(entityTypeName, parentEntityId, context);

  // Assign IDs to the entity and all nested child entities
  const entityWithIds = assignEntityIds(metadata.elementSchema, entityData);

  return produce(context.serializedDefinition, (draft) => {
    const array = get(draft, path) as unknown;
    if (!Array.isArray(array)) {
      throw new TypeError(
        `Expected array at path "${path.join('.')}" but got ${typeof array}`,
      );
    }
    array.push(entityWithIds);
  });
}

export interface UpdateEntityInput {
  entityTypeName: string;
  entityId: string;
  entityData: Record<string, unknown>;
}

/**
 * Updates an existing entity by ID.
 *
 * Replaces the entity data while preserving the entity's ID.
 *
 * @returns A new definition with the entity updated (original is not modified)
 */
export function updateEntity(
  { entityTypeName, entityId, entityData }: UpdateEntityInput,
  context: EntityServiceContext,
): Record<string, unknown> {
  const metadata = context.entityTypeMap.get(entityTypeName);
  if (!metadata) {
    throw new Error(`Unknown entity type: ${entityTypeName}`);
  }

  // Verify the entity exists and get its path
  const entity = context.lookupEntity(entityId);
  if (!entity) {
    throw new Error(
      `Entity "${entityId}" of type "${entityTypeName}" not found`,
    );
  }

  // Preserve the ID in the updated data but populate any children entities with new IDs if they don't have an ID yet.
  const updatedEntity = assignEntityIds(metadata.elementSchema, entityData, {
    isExistingId: (id) => !!context.lookupEntity(id),
  });

  return produce(context.serializedDefinition, (draft) => {
    const target = get(draft, entity.path) as unknown;
    if (!isPlainObject(target)) {
      throw new TypeError(
        `Expected plain object at path "${entity.path.join('.')}" but got ${typeof target}`,
      );
    }

    // Find the parent array and the entity's index within it
    const parentPath = entity.path.slice(0, -1);
    const entityIndex = entity.path.at(-1) as number;
    const parentArray = get(draft, parentPath) as unknown;
    if (!Array.isArray(parentArray)) {
      throw new TypeError(
        `Expected array at path "${parentPath.join('.')}" but got ${typeof parentArray}`,
      );
    }

    parentArray[entityIndex] = updatedEntity;
  });
}

export interface DeleteEntityInput {
  entityTypeName: string;
  entityId: string;
}

/**
 * Deletes an entity by ID.
 *
 * @returns A new definition with the entity removed (original is not modified)
 */
export function deleteEntity(
  { entityTypeName, entityId }: DeleteEntityInput,
  context: EntityServiceContext,
): Record<string, unknown> {
  const metadata = context.entityTypeMap.get(entityTypeName);
  if (!metadata) {
    throw new Error(`Unknown entity type: ${entityTypeName}`);
  }

  // Verify the entity exists and get its path
  const entity = context.lookupEntity(entityId);
  if (!entity) {
    throw new Error(
      `Entity "${entityId}" of type "${entityTypeName}" not found`,
    );
  }

  // Find the parent array and remove the entity by index
  const parentPath = entity.path.slice(0, -1);
  const entityIndex = entity.path.at(-1) as number;

  return produce(context.serializedDefinition, (draft) => {
    const parentArray = get(draft, parentPath) as unknown;
    if (!Array.isArray(parentArray)) {
      throw new TypeError(
        `Expected array at path "${parentPath.join('.')}" but got ${typeof parentArray}`,
      );
    }

    parentArray.splice(entityIndex, 1);
  });
}
