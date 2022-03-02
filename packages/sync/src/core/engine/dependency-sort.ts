import R from 'ramda';
import toposort from 'toposort';
import { notEmpty } from '@src/utils/arrays';
import { ProviderExportMap } from '../generator';
import { ProviderExport } from '../provider';
import { EntryDependencyMap } from './dependency-map';
import { GeneratorEntry } from './generator-builder';

function normalizeExportMap(exportMap: ProviderExportMap): ProviderExport[] {
  return Object.values(exportMap).map((provider) =>
    provider.type === 'type' ? provider.export() : provider
  );
}

function getExportInterdependencies(
  entries: GeneratorEntry[],
  dependencyMap: EntryDependencyMap
): { nodes: string[]; edges: [string, string][] } {
  const entriesById = R.indexBy(R.prop('id'), entries);

  // Map of entry ID#providerName to generators that depend on it
  const exportDependencies: Record<string, string[]> = {};

  Object.entries(dependencyMap).forEach(([entryId, entryDependencies]) => {
    const entry = entriesById[entryId];
    Object.entries(entry.dependencies).forEach(([depName, dep]) => {
      const resolvedDependency = entryDependencies[depName];
      if (!resolvedDependency) {
        return;
      }
      const providerName = dep.name;
      const key = `${resolvedDependency}#${providerName}`;

      exportDependencies[key] = [...(exportDependencies[key] || []), entryId];
    });
  });

  const nodes: string[] = [];
  const edges = entries.flatMap((entry) => {
    const normalizedExports = normalizeExportMap(entry.exports);
    const exportsWithDependencies = normalizedExports.filter(
      (e) => e.options.dependencies
    );

    const exportsThatAreDependencies = R.uniq(
      exportsWithDependencies.flatMap(
        (exportWithDependency) =>
          exportWithDependency.options.dependencies?.map((dependency) => {
            const foundExport = normalizedExports.find(
              (e) => e.name === dependency.name
            );
            if (!foundExport) {
              throw new Error(
                `Could not find export dependency ${exportWithDependency.name} in ${entry.id}`
              );
            }
            return foundExport;
          }) || []
      )
    );

    const exportsInvolvingDependencies = R.uniq([
      ...exportsWithDependencies,
      ...exportsThatAreDependencies,
    ]);

    return exportsInvolvingDependencies.flatMap((e) => {
      const { dependencies = [] } = e.options;

      const dependentExportKey = `${entry.id}#${e.name}`;

      // create links from this export to the export that it depends on
      const exportToDependentExports = dependencies.map((dependency) => {
        const dependencyExportKey = `${entry.id}#${dependency.name}`;
        return [dependencyExportKey, dependentExportKey] as [string, string];
      });

      // create links between this export and generators that depend on this export's dependencies
      const generatorsToExportRelationships = dependencies.flatMap(
        (dependency) => {
          const dependencyExportKey = `${entry.id}#${dependency.name}`;
          const generators = exportDependencies[dependencyExportKey] || [];
          return generators.map((generatorId): [string, string] => [
            generatorId,
            dependentExportKey,
          ]);
        }
      );

      // create links between this export to the generators that depend on it
      const exportToGeneratorRelationships = (
        exportDependencies[dependentExportKey] || []
      ).map((generator): [string, string] => [dependentExportKey, generator]);

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

  const { nodes: interdependentNodes, edges: interdependentEdges } =
    getExportInterdependencies(entries, dependencyMap);

  const result = toposort.array(
    [...entries.map(R.prop('id')), ...interdependentNodes],
    [...dependencyGraph, ...interdependentEdges]
  );

  // filter out interdepenency nodes
  return result.filter((node) => !interdependentNodes.includes(node));
}
