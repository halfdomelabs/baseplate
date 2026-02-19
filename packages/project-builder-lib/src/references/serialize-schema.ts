import { get, set } from 'es-toolkit/compat';
import { produce } from 'immer';

import type {
  def,
  DefinitionSchemaCreator,
  DefinitionSchemaCreatorOptions,
} from '#src/schema/index.js';

import { cleanDefaultValues } from '#src/parser/clean-default-values.js';
import { createDefinitionSchemaParserContext } from '#src/schema/creator/index.js';

import type { ResolvedZodRefPayload } from './types.js';

import { extractDefinitionRefs } from './extract-definition-refs.js';
import { resolveZodRefPayloadNames } from './resolve-zod-ref-payload-names.js';

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

/**
 * Serializes a schema value by:
 * 1. Parsing the input with Zod (populating defaults)
 * 2. Stripping values that match their registered defaults
 * 3. Extracting and resolving entity/reference metadata
 * 4. Replacing entity IDs with their human-readable names
 */
export function serializeSchema<T extends DefinitionSchemaCreator>(
  schemaCreator: T,
  value: unknown,
  schemaCreatorOptions: DefinitionSchemaCreatorOptions,
): def.InferOutput<T> {
  const schemaContext =
    createDefinitionSchemaParserContext(schemaCreatorOptions);
  const schema = schemaCreator(schemaContext) as def.InferSchema<T>;

  // Step 1: Validate with Zod (prefault populates defaults)
  const rawValue = schema.parse(value);

  // Step 2: Strip values matching their registered defaults
  const cleanedValue = cleanDefaultValues(schema, rawValue);

  // Step 3: Walk schema+data to extract ref metadata
  const refPayload = extractDefinitionRefs(schema, cleanedValue);
  const resolvedPayload = resolveZodRefPayloadNames(refPayload);

  // Step 4: Replace entity IDs with names
  return serializeSchemaFromRefPayload(resolvedPayload);
}
