import * as R from 'ramda';
import toposort from 'toposort';

import { EntryDependencyMap } from './dependency-map.js';
import { GeneratorTaskEntry } from './generator-builder.js';
import { ProviderExportMap } from '../generator.js';
import { ProviderExport } from '../provider.js';
import { notEmpty } from '@src/utils/arrays.js';

function normalizeExportMap(exportMap: ProviderExportMap): ProviderExport[] {
  return Object.values(exportMap).map((provider) =>
    provider.type === 'type' ? provider.export() : provider,
  );
}

function getExportInterdependencies(
  entries: GeneratorTaskEntry[],
  dependencyMap: EntryDependencyMap,
): { nodes: string[]; edges: [string, string][] } {
  const entriesById = R.indexBy(R.prop('id'), entries);

  // Map of entry ID#providerName to generators that depend on it
  const exportDependencies: Record<
    string,
    { id: string; modifiedInBuild: boolean }[]
  > = {};

  Object.entries(dependencyMap).forEach(([entryId, entryDependencies]) => {
    const entry = entriesById[entryId];
    Object.entries(entry.dependencies).forEach(([depName, dep]) => {
      const resolvedDependency = entryDependencies[depName];
      if (!resolvedDependency) {
        return;
      }
      const providerName = dep.name;
      const key = `provider|${resolvedDependency.id}#${providerName}`;

      const modifiedInBuild =
        (dep.type === 'dependency' && dep.options.modifiedInBuild) || false;

      exportDependencies[key] = [
        ...(exportDependencies[key] ?? []),
        { id: entryId, modifiedInBuild },
      ];
    });
  });

  const nodes: string[] = [];
  const edges = entries.flatMap((entry) => {
    const normalizedExports = normalizeExportMap(entry.exports);
    const exportsWithDependencies = normalizedExports.filter(
      (e) => e.options.dependencies,
    );

    const exportsThatAreDependencies = R.uniq(
      exportsWithDependencies.flatMap(
        (exportWithDependency) =>
          exportWithDependency.options.dependencies?.map((dependency) => {
            const foundExport = normalizedExports.find(
              (e) => e.name === dependency.name,
            );
            if (!foundExport) {
              throw new Error(
                `Could not find export dependency ${exportWithDependency.name} in ${entry.id}`,
              );
            }
            return foundExport;
          }) ?? [],
      ),
    );

    const exportsInvolvingDependencies = R.uniq([
      ...exportsWithDependencies,
      ...exportsThatAreDependencies,
    ]);

    return exportsInvolvingDependencies.flatMap((e) => {
      const { dependencies = [] } = e.options;

      const dependentExportKey = `provider|${entry.id}#${e.name}`;

      // create links from this export to the export that it depends on
      const exportToDependentExports = dependencies.map((dependency) => {
        const dependencyExportKey = `provider|${entry.id}#${dependency.name}`;
        return [dependencyExportKey, dependentExportKey] as [string, string];
      });

      // create links between this export and the build result of generators that depend on this export's dependencies
      const generatorsToExportRelationships = dependencies.flatMap(
        (dependency) => {
          const dependencyExportKey = `provider|${entry.id}#${dependency.name}`;
          const generators = exportDependencies[dependencyExportKey] ?? [];
          return generators.map((generator): [string, string] => [
            generator.modifiedInBuild
              ? `build|${generator.id}`
              : `init|${generator.id}`,
            dependentExportKey,
          ]);
        },
      );

      // create links between this export to the generators that depend on it
      const exportToGeneratorRelationships = (
        exportDependencies[dependentExportKey] ?? []
      ).map((generator): [string, string] => [
        dependentExportKey,
        `init|${generator.id}`,
      ]);

      nodes.push(dependentExportKey);

      return [
        ...exportToDependentExports,
        ...generatorsToExportRelationships,
        ...exportToGeneratorRelationships,
      ];
    });
  });

  return { edges, nodes };
}

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
): string[] {
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
  const { nodes: interdependentNodes, edges: interdependentEdges } =
    getExportInterdependencies(entries, dependencyMap);

  const result = toposort.array(
    [
      ...entries.flatMap(({ id }) => [`init|${id}`, `build|${id}`]),
      ...interdependentNodes,
    ],
    [...dependencyGraph, ...interdependentEdges],
  );

  // filter out interdepenency nodes
  return result.filter((node) => !interdependentNodes.includes(node));
}
