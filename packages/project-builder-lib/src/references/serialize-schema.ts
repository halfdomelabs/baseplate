import { get, set } from 'es-toolkit/compat';
import { produce } from 'immer';

import type {
  def,
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from '#src/schema/index.js';

import type { ResolvedZodRefPayload } from './types.js';

import { parseSchemaWithTransformedReferences } from './parse-schema-with-references.js';

export function serializeSchemaFromRefPayload<TValue>(
  payload: ResolvedZodRefPayload<TValue>,
): TValue {
  const { references, entities, data } = payload;

  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Data is not an object');
  }

  const entitiesById = new Map(entities.map((e) => [e.id, e]));

  return produce((draftData: object) => {
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

export function serializeSchema<T extends DefinitionSchemaCreator>(
  schemaCreator: T,
  value: unknown,
  schemaCreatorOptions: DefinitionSchemaCreatorOptions,
): def.InferOutput<T> {
  const payload = parseSchemaWithTransformedReferences(
    schemaCreator,
    value,
    schemaCreatorOptions,
  );

  return serializeSchemaFromRefPayload(payload);
}
