import { produce } from 'immer';
import _ from 'lodash';
import { TypeOf, z } from 'zod';

import { ZodRefWrapper } from './ref-builder.js';

export function serializeSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: TypeOf<TSchema>,
): TypeOf<TSchema> {
  const payload = ZodRefWrapper.create(schema).parse(value);

  // resolve all references
  const { references, entities, data } = payload;

  const entitiesById = _.keyBy(entities, (e) => e.id);

  return produce((draftData) => {
    entities.forEach((entity) => {
      if (entity.stripIdWhenSerializing) {
        _.unset(draftData, entity.idPath);
      }
    });

    references.forEach((reference) => {
      const entityId = _.get(draftData, reference.path) as string;
      const entity = entitiesById[entityId];
      if (!entity) {
        throw new Error(
          `Could not find entity with ID: ${entityId} at ${reference.path.join(
            '.',
          )}`,
        );
      }
      _.set(draftData, reference.path, entity.name);
    });
  })(data) as unknown;
}
