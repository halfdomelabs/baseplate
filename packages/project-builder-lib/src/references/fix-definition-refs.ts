import type { z } from 'zod';

import type { FixRefDeletionResult } from './fix-ref-deletions.js';
import type { ResolvedZodRefPayload } from './types.js';

import { applyExpressionRenames } from './fix-expression-renames.js';
import { fixRefDeletions } from './fix-ref-deletions.js';
import { parseSchemaWithTransformedReferences } from './parse-schema-with-references.js';

export interface FixDefinitionRefsOptions {
  /** Ref payload from the previous definition version, for detecting expression renames. */
  oldRefPayload?: ResolvedZodRefPayload<unknown>;
}

/**
 * Fixes expression renames and dangling references in a single pass.
 *
 * Expression renames use the OLD definition (via `oldRefPayload`) to resolve
 * entity references — expressions still contain old names like `model.title`,
 * which can only be resolved against the definition where those names exist.
 * The new entity names are then used to detect what was renamed.
 *
 * @param schema - The project definition Zod schema
 * @param value - The definition after auto-fixes
 * @param options - Optional old ref payload for rename detection
 * @returns The fixed definition with ref payload
 */
export function fixDefinitionRefs<T extends z.ZodType>(
  schema: T,
  value: unknown,
  options?: FixDefinitionRefsOptions,
): FixRefDeletionResult<z.output<T>> {
  if (!options?.oldRefPayload) {
    return fixRefDeletions(schema, value);
  }

  // Parse the new definition to get new entities (for rename comparison)
  const newRefPayload = parseSchemaWithTransformedReferences(schema, value, {
    allowInvalidReferences: true,
  });

  const { value: renamedValue, modified } = applyExpressionRenames(
    newRefPayload.data,
    newRefPayload.entities,
    options.oldRefPayload,
  );

  // Run fixRefDeletions on the (possibly renamed) definition
  return fixRefDeletions(schema, modified ? renamedValue : newRefPayload.data);
}
