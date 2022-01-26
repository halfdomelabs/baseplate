import R from 'ramda';
import toposort from 'toposort';
import { notEmpty } from '@src/utils/arrays';
import { EntryDependencyMap } from './dependency-map';
import { GeneratorEntry } from './generator-builder';

/**
 * Extracts a sorted list of entry IDs that abides by the provided dependency map
 *
 * @param entries All generator entries to sort
 * @param dependencyMap Dependency map of the entries
 */
export function getSortedEntryIds(
  entries: GeneratorEntry[],
  dependencyMap: EntryDependencyMap
): string[] {
  const dependencyGraph = R.unnest(
    entries.map((entry) =>
      Object.values(dependencyMap[entry.id])
        .filter(notEmpty)
        .map((dependentId): [string, string] => [dependentId, entry.id])
    )
  );

  return toposort.array(entries.map(R.prop('id')), dependencyGraph);
}
