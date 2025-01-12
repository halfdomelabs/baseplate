import * as R from 'ramda';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '@src/generators/entry-builder.js';
import type {
  ProviderDependency,
  ProviderExport,
  ProviderType,
} from '@src/providers/index.js';

/**
 * Converts a provider map to a list of provider names
 */
export function providerMapToNames(
  map?: Record<string, ProviderType | ProviderDependency | ProviderExport>,
): string[] {
  if (!map) {
    return [];
  }
  return Object.values(map).map((d) => d.name);
}

/**
 * Recursively goes through generator children and extracts them into a flat list
 *
 * @param entry Generator entry
 * @returns Flat list of generator entry and its children
 */
export function flattenGeneratorEntries(
  entry: GeneratorEntry,
): GeneratorEntry[] {
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
