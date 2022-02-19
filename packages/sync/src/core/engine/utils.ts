import R from 'ramda';
import { ProviderType, ProviderDependency, ProviderExport } from '../provider';
import { GeneratorEntry } from './generator-builder';

/**
 * Converts a provider map to a list of provider names
 */
export function providerMapToNames(map?: {
  [key: string]: ProviderType | ProviderDependency | ProviderExport;
}): string[] {
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
  entry: GeneratorEntry
): GeneratorEntry[] {
  const childEntries = entry.children.map((child) =>
    flattenGeneratorEntries(child)
  );
  return R.flatten([entry, ...childEntries]);
}
