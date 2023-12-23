import _ from 'lodash';
import toposort from 'toposort';
import { TypeOf, input, z } from 'zod';

import { ZodRefPayload, ZodRefWrapper } from './ref-builder.js';
import { ReferencePath } from './types.js';

function pathToString(path: ReferencePath): string {
  return path.map((p) => p.toString()).join('.');
}

export function deserializeSchemaWithReferences<TSchema extends z.ZodType>(
  schema: TSchema,
  input: input<TSchema>,
): ZodRefPayload<TypeOf<TSchema>> {
  const payload = ZodRefWrapper.create(schema, true).parse(input);

  // resolve all references
  const { references, entities, data } = payload;

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
      .map((entityType) => [entityType.name, entityType.parentType?.name]),
  );

  const entitiesByType = _.groupBy(entities, (e) => e.type.name);
  const entityByPath = _.keyBy(entities, (e) => pathToString(e.path));
  const referencesByType = _.groupBy(references, (r) => r.type.name);

  entityTypeOrder.forEach((name) => {
    const entities = entitiesByType[name];
    const references = referencesByType[name];

    function referenceToNameParentId(name: string, parentId?: string): string {
      return JSON.stringify({ name, parentId });
    }

    // fill in entity IDs
    entities.forEach((entity) => {
      entity.id;
    });

    // resolve references to their ID
    const entitiesByParentIdName = _.keyBy(entities, (e) => {
      const parentPath = e.parentPath && pathToString(e.parentPath);
      const parentId = parentPath ? entityByPath[parentPath]?.id : undefined;

      if (parentPath && !parentId) {
        throw new Error(`Could not resolve parent path: ${parentPath}`);
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
          `Unable to resolve reference: ${ref.path.join(
            '.',
          )} (${parentIdName})`,
        );
      }
      _.set(data, ref.path, resolvedEntity.id);
    });
  });

  return payload;
}
