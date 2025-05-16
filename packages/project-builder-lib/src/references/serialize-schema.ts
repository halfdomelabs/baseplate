import type { TypeOf, z } from 'zod';

import { get, set } from 'es-toolkit/compat';
import { produce } from 'immer';

import type { ResolvedZodRefPayload } from './types.js';

import { parseSchemaWithReferences } from './parse-schema-with-references.js';

export function serializeSchemaFromRefPayload<
  TValue extends Record<string, unknown>,
>(payload: ResolvedZodRefPayload<TValue>): TValue {
  const { references, entities, data } = payload;

  const entitiesById = new Map(entities.map((e) => [e.id, e]));

  return produce((draftData: Record<string, unknown>) => {
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
  const payload = parseSchemaWithReferences(schema, value);

  return serializeSchemaFromRefPayload(payload) as unknown;
}
