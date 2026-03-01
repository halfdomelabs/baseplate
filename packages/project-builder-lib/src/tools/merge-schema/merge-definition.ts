import type { PartialDeep } from 'type-fest';

import type { ProjectDefinitionInput } from '#src/schema/index.js';

import { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import { serializeSchema } from '#src/references/serialize-schema.js';

import { mergeDataWithSchema } from './merge-data-with-schema.js';

/**
 * Merges a partial serialized definition into a project definition container.
 *
 * Uses a full-definition round-trip:
 * 1. Serialize the current definition (IDs → names)
 * 2. Merge the partial definition into the serialized definition using `mergeDataWithSchema`
 * 3. Deserialize back via `fromSerializedConfig` (names → IDs)
 *
 * Entity arrays (models, fields, relations, etc.) are auto-merged by name.
 * Non-entity arrays use `withMergeRule` annotations or default to full-replace.
 * Undefined fields in `partialDef` are untouched (partial patch semantics).
 *
 * @param container - The current project definition container
 * @param partialDef - A partial serialized definition to merge in (uses entity names, not IDs)
 * @returns A new ProjectDefinitionContainer with the merged definition
 */
export function mergeDefinition(
  container: ProjectDefinitionContainer,
  partialDef: PartialDeep<ProjectDefinitionInput, { recurseIntoArrays: true }>,
): ProjectDefinitionContainer {
  const serializedDef = serializeSchema(container.schema, container.definition);
  const merged = mergeDataWithSchema(
    container.schema,
    serializedDef,
    partialDef,
  );

  return ProjectDefinitionContainer.fromSerializedConfig(
    merged,
    container.parserContext,
  );
}
