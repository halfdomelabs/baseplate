import { mapGroupBy } from '@baseplate-dev/utils';

import type { CollectedRefs } from './collect-refs.js';
import type { RefContextSlot } from './ref-context-slot.js';
import type { ReferencePath } from './types.js';

export interface ResolvedSlot {
  /**
   * Path to the resolved slot
   */
  resolvedPath: ReferencePath;
  /**
   * Path to the parent context of the slot
   */
  path: ReferencePath;
}

/**
 * Calculates the length of the common prefix of two paths.
 *
 * @param a - The first path
 * @param b - The second path
 * @returns The length of the common prefix of the two paths
 */
function commonPrefixLength(a: ReferencePath, b: ReferencePath): number {
  let length = 0;
  const maxLength = Math.min(a.length, b.length);
  for (let i = 0; i < maxLength; i++) {
    if (a[i] !== b[i]) break;
    length++;
  }
  return length;
}

/**
 * Finds the nearest ancestor slot for a given target path.
 *
 * @param candidateSlots - The candidate slots to search through.
 * @param targetPath - The target path to find the nearest ancestor slot for.
 * @returns The nearest ancestor slot, or undefined if no slot is found.
 */
export function findNearestAncestorSlot<T extends { path: ReferencePath }>(
  candidateSlots: T[] | undefined = [],
  targetPath: ReferencePath,
): T | undefined {
  let bestMatch: { prefixLength: number; slot: T } | undefined;
  for (const candidateSlot of candidateSlots) {
    const prefixLength = commonPrefixLength(candidateSlot.path, targetPath);
    // A slot at path [] (root) is a valid ancestor of any path
    // For non-root slots, require at least 1 common prefix element
    const isValidAncestor = candidateSlot.path.length === 0 || prefixLength > 0;
    if (
      isValidAncestor &&
      (!bestMatch || prefixLength > bestMatch.prefixLength)
    ) {
      bestMatch = { prefixLength, slot: candidateSlot };
    }
  }
  return bestMatch?.slot;
}

/**
 * Resolves all slot references to actual paths.
 *
 * This function takes the collected refs (which have `parentSlot` references)
 * and resolves them to `parentPath` values using the slotPaths map.
 *
 * For scoped slots (where the same slot can be registered multiple times),
 * we find the registration whose path is the nearest ancestor of the entity/reference.
 *
 * @param collected - The collected refs with unresolved slots.
 * @returns The resolved refs with parentPath instead of parentSlot.
 * @throws If a required slot is not found in the slotPaths map.
 */
export function resolveSlots(
  collected: CollectedRefs,
): Map<symbol, ResolvedSlot[]> {
  const { entities, references, slots } = collected;

  // Collect all slots by path
  const slotsByType = mapGroupBy(slots, (slot) => slot.slot.id);
  const resolvedSlotsByType = new Map<symbol, ResolvedSlot[]>();

  function registerSlot(
    slot: RefContextSlot,
    resolvedPath: ReferencePath,
  ): void {
    const slotId = slot.id;
    const candidateSlots = slotsByType.get(slotId) ?? [];
    const nearestAncestorSlot = findNearestAncestorSlot(
      candidateSlots,
      resolvedPath,
    );
    if (!nearestAncestorSlot) {
      throw new Error(
        `Could not find slot "${slotId.description ?? 'unknown'}" ` +
          `within path ${resolvedPath.join('.')}. Make sure the slot is registered for this path.`,
      );
    }
    const existingSlots = resolvedSlotsByType.get(slotId) ?? [];
    resolvedSlotsByType.set(slotId, [
      ...existingSlots,
      { resolvedPath, path: nearestAncestorSlot.path },
    ]);
  }

  // Collect entity provides
  for (const entity of entities) {
    if (entity.provides) {
      registerSlot(entity.provides, [...entity.path, ...entity.idPath]);
    }
  }

  // Collect reference provides
  for (const reference of references) {
    if (reference.provides) {
      registerSlot(reference.provides, reference.path);
    }
  }

  return resolvedSlotsByType;
}
