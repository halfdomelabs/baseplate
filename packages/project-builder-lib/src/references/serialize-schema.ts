import type { TypeOf, z } from 'zod';

import { get, set, unset } from 'es-toolkit/compat';
import { produce } from 'immer';

import type { ZodRefPayload } from './ref-builder.js';

import { ZodRefWrapper } from './ref-builder.js';

export function serializeSchemaFromRefPayload<
  TValue extends Record<string, unknown>,
>(payload: ZodRefPayload<TValue>): TValue {
  const { references, entities, data } = payload;

  const entitiesById = new Map(entities.map((e) => [e.id, e]));

  return produce((draftData: Record<string, unknown>) => {
    for (const entity of entities) {
      if (entity.stripIdWhenSerializing) {
        unset(draftData, entity.idPath);
      }
    }

    for (const reference of references) {
      const entityId = get(draftData, reference.path) as string;
      const entity = entitiesById.get(entityId);
      if (!entity) {
        throw new Error(
          `Could not find entity with ID: ${entityId} at ${reference.path.join(
            '.',
          )}`,
        );
      }
      set(draftData, reference.path, entity.name);
    }
  })(data) as TValue;
}

export function serializeSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: TypeOf<TSchema>,
): TypeOf<TSchema> {
  const payload = ZodRefWrapper.create(schema).parse(value);

  return serializeSchemaFromRefPayload(payload) as unknown;
}
