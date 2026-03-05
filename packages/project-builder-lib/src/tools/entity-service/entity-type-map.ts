import type { z } from 'zod';

import type { SchemaStructureWalkContext } from '#src/parser/walk-schema-structure.js';

import { getSchemaChildren } from '#src/parser/schema-structure.js';
import { walkSchemaStructure } from '#src/parser/walk-schema-structure.js';

import type { EntityTypeMap } from './types.js';

import { getEntityMeta } from '../merge-schema/entity-utils.js';

/**
 * Collects entity metadata from a Zod schema by walking its structure.
 *
 * Walks the schema once, detecting entity arrays (via `definitionRefRegistry`
 * annotations) and building metadata for each entity type including its
 * relative path from the parent entity (or root) and parent entity type linkage.
 *
 * Parent relationships are determined by `entityType.parentType` on the
 * `DefinitionEntityType` instance — when a parent type is set, the walker
 * finds the matching ancestor entity in its stack and computes the relative
 * path from there.
 *
 * Call once per schema and reuse the result.
 */
export function collectEntityMetadata(schema: z.ZodType): EntityTypeMap {
  const map: EntityTypeMap = new Map();

  // Stack of entity types encountered during the walk, used to determine
  // parent-child relationships and compute relative paths.
  const entityStack: {
    entityTypeName: string;
    pathAtEntity: SchemaStructureWalkContext['path'];
  }[] = [];

  walkSchemaStructure(schema, [
    {
      visit(innerSchema, ctx) {
        const children = getSchemaChildren(innerSchema, undefined, []);
        if (children.kind !== 'array') {
          return undefined;
        }

        const entityMeta = getEntityMeta(children.elementSchema);
        if (!entityMeta) {
          return undefined;
        }

        const entityTypeName = entityMeta.type.name;
        const { parentType } = entityMeta.type;

        let parentEntityTypeName: string | undefined;
        let relativePath: SchemaStructureWalkContext['path'];

        if (parentType) {
          // Find the parent entity in the stack
          const parentEntry = entityStack.findLast(
            (entry) => entry.entityTypeName === parentType.name,
          );

          if (!parentEntry) {
            throw new Error(
              `Entity type "${entityTypeName}" declares parent type "${parentType.name}" ` +
                `but no such entity was found in the ancestor chain`,
            );
          }

          parentEntityTypeName = parentType.name;
          relativePath = ctx.path.slice(parentEntry.pathAtEntity.length);
        } else {
          // Top-level entity: relative path is the full path
          relativePath = ctx.path;
        }

        map.set(entityTypeName, {
          name: entityTypeName,
          entityType: entityMeta.type,
          entityMeta,
          elementSchema: children.elementSchema,
          relativePath,
          parentEntityTypeName,
        });

        // Push onto entity stack. Child relative paths are computed by
        // slicing from this position — the walker adds discriminated-union-array
        // elements when descending into array branches.
        entityStack.push({
          entityTypeName,
          pathAtEntity: ctx.path,
        });
        return () => {
          entityStack.pop();
        };
      },
    },
  ]);

  return map;
}
