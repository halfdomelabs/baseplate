import toposort from 'toposort';

import { notEmpty } from '@src/utils/arrays.js';

import type { GeneratorTaskEntry } from '../generators/entry-builder.js';
import type { EntryDependencyMap } from './dependency-map.js';

/**
 * Extracts a sorted list of run steps that abides by the provided dependency map
 *
 * Run steps involve:
 *  - init:<entryId>
 *  - build:<entryId>
 *
 * @param entries All generator entries to sort
 * @param dependencyMap Dependency map of the entries
 */
export function getSortedRunSteps(
  entries: GeneratorTaskEntry[],
  dependencyMap: EntryDependencyMap,
): {
  steps: string[];
  metadata: { fullSteps: string[]; fullEdges: [string, string][] };
} {
  const dependencyGraph = entries.flatMap((entry): [string, string][] => {
    const entryInit = `init|${entry.id}`;
    const entryBuild = `build|${entry.id}`;

    return [
      [entryInit, entryBuild],
      ...entry.dependentTaskIds.map((taskId): [string, string] => {
        const dependentBuild = `build|${taskId}`;
        return [dependentBuild, entryInit];
      }),
      ...Object.values(dependencyMap[entry.id])
        .filter(notEmpty)
        .flatMap((dependent): [string, string][] => {
          const dependentInit = `init|${dependent.id}`;
          const dependentBuild = `build|${dependent.id}`;
          return [
            [dependentInit, entryInit],
            // we don't attach a build step dependency if the provider is a read-only provider
            ...(dependent.options?.isReadOnly
              ? []
              : [[entryBuild, dependentBuild] as [string, string]]),
          ];
        }),
    ];
  });

  const fullSteps = entries.flatMap(({ id }) => [`init|${id}`, `build|${id}`]);
  const fullEdges = dependencyGraph;

  const result = toposort.array(fullSteps, fullEdges);

  return {
    steps: result,
    metadata: { fullSteps, fullEdges },
  };
}
