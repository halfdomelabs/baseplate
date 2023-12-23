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

  const dataCopy = _.clone(data);
  const entitiesById = _.keyBy(entities, (e) => e.id);

  references.forEach((reference) => {
    const entityId = _.get(dataCopy, reference.path) as string;
    const entity = entitiesById[entityId];
    if (!entity) {
      throw new Error(`Could not find entity with ID: ${entityId}`);
    }
    _.set(dataCopy, reference.path, entity.name);
  });

  return dataCopy as unknown;
}
