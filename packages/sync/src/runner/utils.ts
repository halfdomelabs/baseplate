import * as R from 'ramda';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/build-generator-entry.js';

/**
 * Recursively goes through generator children and extracts them into a flat list
 *
 * @param entry Generator entry
 * @returns Flat list of generator entry and its children
 */
function flattenGeneratorEntries(entry: GeneratorEntry): GeneratorEntry[] {
  const childEntries = entry.children.map((child) =>
    flattenGeneratorEntries(child),
  );
  return R.flatten([entry, ...childEntries]);
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
