import { set } from 'es-toolkit/compat';

import type {
  DefinitionEntity,
  ReferencePath,
  ResolvedZodRefPayload,
} from './types.js';

export interface ApplyExpressionRenamesResult<T> {
  value: T;
  modified: boolean;
}

/**
 * Detects renamed entities and updates expression strings accordingly.
 *
 * Uses the OLD definition/refPayload to resolve entity references (since
 * expressions still contain old names like `model.title`), then compares
 * old vs new entity names to detect renames and apply position-based
 * string replacements on the NEW definition.
 *
 * @param newDefinition - The new definition value (where expressions will be updated)
 * @param newEntities - Entities from the new definition (with new names)
 * @param oldRefPayload - The ref payload from the old definition (has old expressions, entities, and definition)
 * @returns The (possibly modified) definition and whether any renames were applied
 */
export function applyExpressionRenames<T>(
  newDefinition: T,
  newEntities: readonly DefinitionEntity[],
  oldRefPayload: ResolvedZodRefPayload<unknown>,
): ApplyExpressionRenamesResult<T> {
  const { expressions: oldExpressions, entities: oldEntities } = oldRefPayload;

  if (oldExpressions.length === 0) {
    return { value: newDefinition, modified: false };
  }

  // Detect renames: compare old vs new entity names by ID
  const renames = new Map<string, string>(); // entityId → newName
  const newNameById = new Map<string, string>();
  for (const entity of newEntities) {
    newNameById.set(entity.id, entity.name);
  }
  for (const entity of oldEntities) {
    const newName = newNameById.get(entity.id);
    if (newName !== undefined && newName !== entity.name) {
      renames.set(entity.id, newName);
    }
  }

  if (renames.size === 0) {
    return { value: newDefinition, modified: false };
  }

  let modified = false;
  const updates: { path: ReferencePath; value: string }[] = [];

  for (const expression of oldExpressions) {
    // Parse and resolve entities against the OLD definition where old names still exist
    const parseResult = expression.parser.parse(
      expression.value,
      oldRefPayload.data,
    );
    if (!parseResult.success) {
      // Don't touch broken expressions
      continue;
    }

    const refs = expression.parser.getReferencedEntities(
      expression.value,
      parseResult,
      oldRefPayload.data,
      expression.resolvedSlots,
    );

    // Build replacements for renamed entities
    const replacements: { start: number; end: number; newValue: string }[] = [];
    for (const ref of refs) {
      const newName = renames.get(ref.entityId);
      if (newName !== undefined) {
        replacements.push({
          start: ref.start,
          end: ref.end,
          newValue: newName,
        });
      }
    }

    if (replacements.length === 0) {
      continue;
    }

    // Sort by position descending so earlier replacements don't shift later positions
    replacements.sort((a, b) => b.start - a.start);

    let updated = expression.value as string;
    for (const { start, end, newValue } of replacements) {
      updated = updated.slice(0, start) + newValue + updated.slice(end);
    }

    modified = true;
    // Update at the same path in the NEW definition
    updates.push({ path: expression.path, value: updated });
  }

  if (!modified) {
    return { value: newDefinition, modified: false };
  }

  const result = structuredClone(newDefinition) as object;
  for (const { path, value } of updates) {
    set(result, path, value);
  }
  return { value: result as T, modified: true };
}
