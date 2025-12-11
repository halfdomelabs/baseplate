import type { DefinitionEntityWithNameResolver } from './definition-ref-builder.js';
import type { RefContextSlot } from './ref-context-slot.js';
import type { DefinitionReference, ReferencePath } from './types.js';

import { collectRefs } from './collect-refs.js';
import { findNearestAncestorSlot, resolveSlots } from './resolve-slots.js';
import { stripRefMarkers } from './strip-ref-markers.js';

/**
 * Payload returned after parsing, containing the data, references, and entities.
 *
 * @template TData - The type of the parsed data.
 */
export interface ExtractDefinitionRefsPayload<TData> {
  data: TData;
  references: DefinitionReference[];
  entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
}

/**
 * Extracts definition refs from a parsed value using functional approach.
 *
 * Flow:
 * 1. Collect all refs (entities, references, slots) recursively
 * 2. Resolve all slot references to actual paths
 * 3. Strip ref markers from the data
 * 4. Validate no duplicate IDs
 *
 * @param value - The parsed value from Zod schema
 * @returns The extracted refs with clean data
 */
export function extractDefinitionRefs<T>(
  value: T,
): ExtractDefinitionRefsPayload<T> {
  // Step 1: Collect all refs without resolving slots
  const collected = collectRefs(value);

  // Step 2: Resolve all slots to paths
  const resolvedSlots = resolveSlots(collected);

  // Step 3: Strip markers from data
  const cleanData = stripRefMarkers(value);

  // Step 4: Resolve entity and reference parent paths
  function resolveParentPath(
    parentSlot: RefContextSlot,
    path: ReferencePath,
  ): ReferencePath | undefined {
    const resolvedSlot = findNearestAncestorSlot(
      resolvedSlots.get(parentSlot.id),
      path,
    );
    if (!resolvedSlot) {
      throw new Error(
        `Could not resolve parent path from ${path.join('.')} for slot ${parentSlot.id.description}`,
      );
    }
    return resolvedSlot.resolvedPath;
  }

  const entitiesWithNameResolver: DefinitionEntityWithNameResolver[] =
    collected.entities.map((entity) => ({
      id: entity.id,
      nameResolver: entity.nameResolver,
      type: entity.type,
      path: entity.path,
      parentPath: entity.parentSlot
        ? resolveParentPath(entity.parentSlot, entity.path)
        : undefined,
    }));

  const references: DefinitionReference[] = collected.references.map(
    (reference) => ({
      type: reference.type,
      path: reference.path,
      onDelete: reference.onDelete,
      parentPath: reference.parentSlot
        ? resolveParentPath(reference.parentSlot, reference.path)
        : undefined,
    }),
  );

  // Step 4: Validate no duplicate IDs
  const idSet = new Set<string>();
  for (const entity of collected.entities) {
    if (idSet.has(entity.id)) {
      throw new Error(`Duplicate ID found: ${entity.id}`);
    }
    idSet.add(entity.id);
  }

  return {
    data: cleanData,
    references,
    entitiesWithNameResolver,
  };
}
