import { notEmpty, toposortDfs } from '@halfdomelabs/utils';

import type { GeneratorOutputMetadata } from '@src/output/generator-task-output.js';

import type { GeneratorTaskEntry } from '../generators/index.js';
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
  metadata: GeneratorOutputMetadata;
} {
  const metadata: GeneratorOutputMetadata = {
    generatorTaskEntries: entries.map((entry) => ({
      id: entry.id,
      generatorName: entry.generatorInfo.name,
      taskName: entry.name,
      instanceName: entry.generatorInfo.instanceName,
    })),
    generatorProviderRelationships: [],
  };

  const dependencyGraph = entries.flatMap((entry): [string, string][] => {
    const entryInit = `init|${entry.id}`;
    const entryBuild = `build|${entry.id}`;

    return [
      [entryInit, entryBuild],
      ...Object.values(dependencyMap[entry.id])
        .filter(notEmpty)
        .flatMap((dependent): [string, string][] => {
          const dependentInit = `init|${dependent.id}`;
          const dependentBuild = `build|${dependent.id}`;

          metadata.generatorProviderRelationships.push({
            providerTaskId: dependent.id,
            consumerTaskId: entry.id,
            providerName: dependent.providerName,
            isOutput: dependent.isOutput,
            isReadOnly: dependent.isReadOnly,
          });

          // if the dependent task is not in the entries, we don't need to add a dependency
          // since it was executed in a previous phase
          if (!entries.some((e) => e.id === dependent.id)) {
            return [];
          }

          // check if the dependency is to an output provider and if so,
          // we need to wait until the dependent task has been built before
          // we can build the current task
          if (dependent.isOutput) {
            return [[dependentBuild, entryInit] as [string, string]];
          }

          return [
            [dependentInit, entryInit],
            // we don't attach a build step dependency if the provider is a read-only provider
            ...(dependent.isReadOnly
              ? []
              : [[entryBuild, dependentBuild] as [string, string]]),
          ];
        }),
    ];
  });

  const fullSteps = entries.flatMap(({ id }) => [`init|${id}`, `build|${id}`]);
  const fullEdges = dependencyGraph;

  const result = toposortDfs(fullSteps, fullEdges.reverse());

  return {
    steps: result,
    metadata,
  };
}
