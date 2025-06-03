import type { TypeOf, z } from 'zod';

import { toposort } from '@baseplate-dev/utils';
import { groupBy, keyBy, uniq } from 'es-toolkit';
import { get, set } from 'es-toolkit/compat';

import type { DefinitionEntity, ResolvedZodRefPayload } from './types.js';

import { parseSchemaWithReferences } from './parse-schema-with-references.js';

function referenceToNameParentId(name: string, parentId?: string): string {
  return JSON.stringify({ name, parentId });
}

export function deserializeSchemaWithReferences<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): ResolvedZodRefPayload<TypeOf<TSchema>> {
  const payload = parseSchemaWithReferences(schema, input, {
    skipReferenceNameResolution: true,
  });

  // resolve all references
  const { references, entities, data } = payload;

  // check we don't have more entities than IDs
  const entitiesById = groupBy(entities, (entity) => entity.id);
  const duplicateEntityIds = Object.values(entitiesById).filter(
    (e) => e.length > 1,
  );
  if (duplicateEntityIds.length > 0) {
    throw new Error(
      `Found multiple duplicate entity IDs: ${duplicateEntityIds
        .map(
          (ents) =>
            `${ents[0].id} (${ents.map((e) => e.path.join('.')).join(',')})`,
        )
        .join(', ')}`,
    );
  }
  const uniqueEntityIds = uniq(entities.map((e) => e.id));
  if (uniqueEntityIds.length !== entities.length) {
    throw new Error(`Found duplicate entity IDs`);
  }

  // collect reference entity types
  const entityTypes = uniq(entities.map((e) => e.type));
  const entityTypeNames = uniq(entityTypes.map((t) => t.name));
  if (entityTypeNames.length !== entityTypes.length) {
    throw new Error(
      `Found more entity types than entity type names implying duplicate entity type name`,
    );
  }

  const entityTypeOrder = toposort(
    entityTypeNames,
    entityTypes
      .filter((entityType) => !!entityType.parentType)
      .map((entityType) => [
        entityType.parentType?.name ?? '',
        entityType.name,
      ]),
  );

  const entitiesByType = groupBy(entities, (e) => e.type.name);
  const referencesByType = groupBy(references, (r) => r.type.name);

  for (const name of entityTypeOrder) {
    const entities = entitiesByType[name] ?? [];
    const references = referencesByType[name] ?? [];

    // resolve references to their ID
    const entitiesByParentIdName: Partial<Record<string, DefinitionEntity>> =
      keyBy(entities, (e) => {
        const { parentPath } = e;
        const parentId = parentPath
          ? (get(data, parentPath) as string)
          : undefined;

        if (parentPath && typeof parentId !== 'string') {
          throw new Error(
            `Could not resolve parent path: ${parentPath.join('.')}`,
          );
        }

        return referenceToNameParentId(e.name, parentId);
      });

    for (const ref of references) {
      const name = get(data, ref.path) as string;
      // parent ID should have already been resolved due to order of resolving references
      const parentId = ref.parentPath && (get(data, ref.parentPath) as string);
      const parentIdName = referenceToNameParentId(name, parentId);

      const resolvedEntity = entitiesByParentIdName[parentIdName];
      if (!resolvedEntity) {
        throw new Error(
          `Unable to resolve reference: ${ref.path.join('.')} (${
            ref.type.name
          } ${parentIdName})`,
        );
      }
      set(data, ref.path, resolvedEntity.id);
    }
  }

  return payload;
}
