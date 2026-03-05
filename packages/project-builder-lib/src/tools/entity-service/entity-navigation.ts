import { isPlainObject } from 'es-toolkit';
import { get } from 'es-toolkit/compat';

import type { SchemaPathElement } from '#src/parser/walk-schema-structure.js';
import type { ReferencePath } from '#src/references/types.js';

import type { EntityServiceContext } from './types.js';

/**
 * Navigates from a starting object through a schema relative path to reach the entity array.
 * Returns the array at the end of the path, or throws an error if the path is invalid.
 */
function navigateToEntityArrayFromSchemaPath(
  obj: Record<string, unknown>,
  relativePath: SchemaPathElement[],
  pathPrefix: ReferencePath,
): { array: unknown[]; path: ReferencePath } {
  let current: unknown = obj;
  const path: ReferencePath = [...pathPrefix];

  for (const element of relativePath) {
    switch (element.type) {
      case 'object-key': {
        if (!isPlainObject(current)) {
          throw new TypeError(
            `Expected object at path "${path.join('.')}" but got ${typeof current}`,
          );
        }
        current = current[element.key];
        path.push(element.key);
        break;
      }
      case 'tuple-index': {
        if (!Array.isArray(current)) {
          throw new TypeError(
            `Expected array at path "${path.join('.')}" but got ${typeof current}`,
          );
        }
        current = current[element.index];
        path.push(element.index);
        break;
      }
      case 'discriminated-union-array': {
        // Enter the array and find the unique element matching the discriminator
        if (!Array.isArray(current)) {
          throw new TypeError(
            `Expected array at path "${path.join('.')}" but got ${typeof current}`,
          );
        }
        const match = current.findIndex((item) => {
          if (!isPlainObject(item)) {
            throw new TypeError(
              `Expected object at path "${path.join('.')}" but got ${typeof item}`,
            );
          }
          return item[element.discriminatorKey] === element.value;
        });
        if (match === -1) {
          throw new Error(
            `No element found in array at path "${path.join('.')}" with discriminator key "${element.discriminatorKey}" and value "${element.value}"`,
          );
        }
        current = current[match];
        path.push(match);
        break;
      }
    }
  }

  if (!Array.isArray(current)) {
    throw new TypeError(
      `Expected array at path "${path.join('.')}" but got ${typeof current}`,
    );
  }

  return { array: current, path };
}

/**
 * Finds the entity array containing entities of the given type.
 *
 * For top-level types: navigates from the definition root.
 * For nested types: finds the parent entity by ID, then navigates from there.
 */
export function resolveEntityArray(
  entityTypeName: string,
  parentEntityId: string | undefined,
  { entityTypeMap, lookupEntity, serializedDefinition }: EntityServiceContext,
): { array: unknown[]; path: ReferencePath } {
  const metadata = entityTypeMap.get(entityTypeName);
  if (!metadata) {
    throw new Error(`Unknown entity type: ${entityTypeName}`);
  }

  let startPath: ReferencePath = [];

  if (metadata.parentEntityTypeName) {
    // Nested entity: find the parent first
    if (!parentEntityId) {
      throw new Error(
        `Entity type "${entityTypeName}" requires a parent entity ID (parent type: "${metadata.parentEntityTypeName}")`,
      );
    }

    const parentResult = lookupEntity(parentEntityId);
    if (!parentResult) {
      throw new Error(
        `Parent entity "${parentEntityId}" not found for entity type "${entityTypeName}"`,
      );
    }

    startPath = parentResult.path;
  }

  const parentEntity = (
    startPath.length === 0
      ? serializedDefinition
      : get(serializedDefinition, startPath)
  ) as unknown;
  if (!isPlainObject(parentEntity)) {
    throw new Error(
      `Parent entity at path "${startPath.join('.')}" is not a plain object`,
    );
  }

  return navigateToEntityArrayFromSchemaPath(
    parentEntity,
    metadata.relativePath,
    startPath,
  );
}
