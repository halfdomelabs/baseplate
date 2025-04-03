import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/build-generator-entry.js';
import type { TaskPhase } from '@src/phases/types.js';

import { sortTaskPhases } from '@src/phases/sort-task-phases.js';

/**
 * Recursively goes through generator children and extracts them into a flat list
 *
 * @param entry Generator entry
 * @returns Flat list of generator entry and its children
 */
function flattenGeneratorEntries(entry: GeneratorEntry): GeneratorEntry[] {
  const childEntries = entry.children.flatMap((child) =>
    flattenGeneratorEntries(child),
  );
  return [entry, ...childEntries];
}

/**
 * Recursively goes through generator task entries and extracts them into a flat list
 *
 * @param entry Generator entry
 * @returns Flat list of generator entry and its children
 */
export function flattenGeneratorTaskEntries(
  entry: GeneratorEntry,
): GeneratorTaskEntry[] {
  const entries = flattenGeneratorEntries(entry);
  return entries.flatMap((e) => e.tasks);
}

/**
 * Extracts the task phases from the generator task entries and sorts them topologically
 *
 * @param entries Generator task entries
 * @returns Sorted task phases
 */
export function extractSortedTaskPhases(
  entries: GeneratorTaskEntry[],
): TaskPhase[] {
  const phases = entries.map((e) => e.phase).filter((x) => x !== undefined);
  return sortTaskPhases(phases);
}
