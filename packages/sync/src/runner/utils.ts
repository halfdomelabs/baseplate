import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/build-generator-entry.js';
import type { TaskPhase } from '@src/phases/types.js';

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
export function flattenGeneratorTaskEntriesAndPhases(entry: GeneratorEntry): {
  taskEntries: GeneratorTaskEntry[];
  phases: TaskPhase[];
} {
  const entries = flattenGeneratorEntries(entry);
  const taskEntries = entries.flatMap((e) => e.tasks);
  const phases = entries.flatMap((e) => [
    ...e.preRegisteredPhases,
    ...e.tasks.map((t) => t.task.phase).filter((x) => x !== undefined),
  ]);
  return { taskEntries, phases };
}
