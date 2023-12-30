import _ from 'lodash';
import toposort from 'toposort';
import { TypeOf, z } from 'zod';

import { ZodRefPayload, ZodRefWrapper } from './ref-builder.js';

export function deserializeSchemaWithReferences<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): ZodRefPayload<TypeOf<TSchema>> {
  const payload = ZodRefWrapper.create(schema, true).parse(input);

  // resolve all references
  const { references, entities, data } = payload;

  // check we don't have more entities than IDs
  const entitiesById = _.groupBy(entities, (entity) => entity.id);
  const duplicateEntityIds = Object.values(entitiesById).filter(
    (e) => e.length > 1,
  );
  if (duplicateEntityIds.length) {
    throw new Error(
      `Found multiple duplicate entity IDs: ${duplicateEntityIds
        .map(
          (ents) =>
            `${ents[0].id} (${ents.map((e) => e.path.join('.')).join(',')})`,
        )
        .join(', ')}`,
    );
  }
  const uniqueEntityIds = _.uniq(entities.map((e) => e.id));
  if (uniqueEntityIds.length !== entities.length) {
    throw new Error(`Found duplicate entity IDs`);
  }

  // collect reference entity types
  const entityTypes = _.uniq(entities.map((e) => e.type));
  const entityTypeNames = _.uniq(entityTypes.map((t) => t.name));
  if (entityTypeNames.length !== entityTypes.length) {
    throw new Error(
      `Found more entity types than entity type names implying duplicate entity type name`,
    );
  }

  const entityTypeOrder = toposort.array(
    entityTypeNames,
    entityTypes
      .filter((entityType) => !!entityType.parentType)
      .map((entityType) => [
        entityType.parentType?.name ?? '',
        entityType.name,
      ]),
  );

  const entitiesByType = _.groupBy(entities, (e) => e.type.name);
  const referencesByType = _.groupBy(references, (r) => r.type.name);

  entityTypeOrder.forEach((name) => {
    const entities = entitiesByType[name] ?? [];
    const references = referencesByType[name] ?? [];

    function referenceToNameParentId(name: string, parentId?: string): string {
      return JSON.stringify({ name, parentId });
    }

    // resolve references to their ID
    const entitiesByParentIdName = _.keyBy(entities, (e) => {
      const parentPath = e.parentPath;
      const parentId = parentPath
        ? (_.get(data, parentPath) as string)
        : undefined;

      if (parentPath && typeof parentId !== 'string') {
        throw new Error(
          `Could not resolve parent path: ${parentPath.join('.')}`,
        );
      }

      return referenceToNameParentId(e.name, parentId);
    });

    references.forEach((ref) => {
      const name = _.get(data, ref.path) as string;
      // parent ID should have already been resolved due to order of resolving references
      const parentId =
        ref.parentPath && (_.get(data, ref.parentPath) as string);
      const parentIdName = referenceToNameParentId(name, parentId);

      const resolvedEntity = entitiesByParentIdName[parentIdName];
      if (!resolvedEntity) {
        throw new Error(
          `Unable to resolve reference: ${ref.path.join('.')} (${
            ref.type.name
          } ${parentIdName})`,
        );
      }
      _.set(data, ref.path, resolvedEntity.id);
    });
  });

  return payload;
}
