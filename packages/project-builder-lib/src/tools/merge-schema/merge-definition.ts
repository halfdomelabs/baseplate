import type { z } from 'zod';

import type {
  PartialProjectDefinitionInput,
  ProjectDefinition,
  ProjectDefinitionInput,
} from '#src/schema/index.js';

import { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import { serializeSchema } from '#src/references/serialize-schema.js';

import { mergeDataWithSchema } from './merge-data-with-schema.js';

/**
 * Merges a partial serialized definition into a project definition,
 * returning the merged serialized definition (input form with names, not IDs).
 *
 * Uses a schema-driven merge:
 * 1. Serialize the current definition (IDs → names)
 * 2. Merge the partial definition into the serialized definition using `mergeDataWithSchema`
 *
 * Entity arrays (models, fields, relations, etc.) are auto-merged by name.
 * Non-entity arrays use `withMergeRule` annotations or default to full-replace.
 * Undefined fields in `partialDef` are untouched (partial patch semantics).
 *
 * @param schema - The project definition Zod schema
 * @param definition - The current parsed project definition (with IDs)
 * @param partialDef - A partial serialized definition to merge in (uses entity names, not IDs)
 * @returns The merged serialized definition (input form)
 */
export function mergeDefinition(
  schema: z.ZodType,
  definition: ProjectDefinition,
  partialDef: PartialProjectDefinitionInput,
): ProjectDefinitionInput {
  const serializedDef = serializeSchema(schema, definition);
  return mergeDataWithSchema(
    schema,
    serializedDef,
    partialDef as never,
  ) as ProjectDefinitionInput;
}

/**
 * Merges a partial serialized definition and returns a new ProjectDefinitionContainer.
 *
 * Convenience wrapper around `mergeDefinition` that performs the full round-trip:
 * serialize → merge → deserialize (names → IDs).
 *
 * @param container - The current project definition container
 * @param partialDef - A partial serialized definition to merge in (uses entity names, not IDs)
 * @returns A new ProjectDefinitionContainer with the merged definition
 */
export function mergeDefinitionContainer(
  container: ProjectDefinitionContainer,
  partialDef: PartialProjectDefinitionInput,
): ProjectDefinitionContainer {
  const merged = mergeDefinition(
    container.schema,
    container.definition,
    partialDef,
  );
  return ProjectDefinitionContainer.fromSerializedConfig(
    merged,
    container.parserContext,
  );
}

/**
 * Creates a function that applies a partial definition merge to a draft config.
 * Use with `saveDefinitionWithFeedback`.
 *
 * @param container - The current project definition container
 * @param partialDef - A partial serialized definition to merge in
 * @returns A setter function that replaces the draft config with the merged definition
 */
export function applyMergedDefinition(
  container: ProjectDefinitionContainer,
  partialDef: PartialProjectDefinitionInput,
): (draftConfig: ProjectDefinition) => void {
  const mergedContainer = mergeDefinitionContainer(container, partialDef);
  return (draftConfig) => {
    Object.assign(draftConfig, mergedContainer.definition);
  };
}
