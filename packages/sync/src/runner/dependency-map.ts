import { mapValues, mergeWith } from 'es-toolkit';

import type { TaskPhase } from '@src/phases/types.js';
import type { Logger } from '@src/utils/evented-logger.js';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '../generators/index.js';
import type { ProviderDependencyOptions } from '../providers/index.js';

type GeneratorIdToScopesMap = Partial<
  Record<
    string,
    {
      // scopes offered by the generator
      scopes: string[];
      // providers within the scopes
      // key is JSON.encode([providerName(, exportName)])
      providers: Map<string, string>;
    }
  >
>;

function makeProviderId(providerName: string, exportName?: string): string {
  return JSON.stringify([providerName, exportName]);
}

function buildGeneratorIdToScopesMapRecursive(
  entry: GeneratorEntry,
  parentTaskIds: string[],
  generatorIdToScopesMap: GeneratorIdToScopesMap,
): void {
  // add the scopes of the entry to cache
  generatorIdToScopesMap[entry.id] = {
    scopes: entry.scopes.map((scope) => scope.name),
    providers: new Map(),
  };
  const newParentTaskIds = [...parentTaskIds, entry.id];

  // add scoped exports and outputs of the entry to cache
  for (const taskEntry of entry.tasks) {
    const { task } = taskEntry;
    const taskExports = Object.values(task.exports ?? {});
    const taskOutputs = Object.values(task.outputs ?? {});
    const invalidTaskExports = taskExports.filter(
      (taskExport) => taskExport.isOutput,
    );
    if (invalidTaskExports.length > 0) {
      throw new Error(
        `All providers in task exports must be non-output providers in ${taskEntry.id}: ${invalidTaskExports
          .map((taskExport) => taskExport.name)
          .join(', ')}`,
      );
    }
    const invalidTaskOutputs = taskOutputs.filter(
      (taskOutput) => !taskOutput.isOutput,
    );
    if (invalidTaskOutputs.length > 0) {
      throw new Error(
        `All providers in task outputs must be output providers in ${taskEntry.id}: ${invalidTaskOutputs
          .map((output) => output.name)
          .join(', ')}`,
      );
    }
    for (const taskExport of [...taskExports, ...taskOutputs]) {
      const { exports } = taskExport;

      for (const { scope, exportName } of exports) {
        // find the parent task ID that offers the scope (if undefined, it is the default scope of the entry itself)
        const parentTaskId = scope
          ? newParentTaskIds.findLast((id) =>
              generatorIdToScopesMap[id]?.scopes.includes(scope.name),
            )
          : entry.id;

        const generatorEntry =
          parentTaskId && generatorIdToScopesMap[parentTaskId];

        if (!generatorEntry) {
          throw new Error(
            `Could not find parent generator with scope ${scope?.name} at ${entry.id}`,
          );
        }

        const { providers } = generatorEntry;
        const providerId = makeProviderId(taskExport.name, exportName);

        const existingProviderId = providers.get(providerId);

        if (existingProviderId) {
          throw new Error(
            `Duplicate scoped provider export detected between ${entry.id} and ${existingProviderId} ` +
              `in scope (${scope?.name ?? 'default'}) at ${parentTaskId} for provider ${taskExport.name}. ` +
              `Please make sure that the provider export names are unique within the scope (and any other scopes at that level).`,
          );
        }
        providers.set(providerId, taskEntry.id);
      }
    }
  }

  for (const child of entry.children) {
    buildGeneratorIdToScopesMapRecursive(
      child,
      newParentTaskIds,
      generatorIdToScopesMap,
    );
  }
}

function mergeAllWithoutDuplicates<T extends Record<string, unknown>>(
  array: T[],
): T {
  const newObj: T = {} as T;
  for (const obj of array) {
    mergeWith(newObj, obj, (obj, src, key) => {
      if (obj !== undefined && src !== undefined) {
        throw new Error(`Duplicate key (${key}) detected`);
      }
    });
  }
  return newObj;
}

/**
 * Builds a map of the entry's dependencies to entry IDs of resolved providers
 *
 * @param entry Generator entry
 * @param cache Generator tasks cache
 */
function buildTaskDependencyMap(
  entry: GeneratorTaskEntry,
  parentEntryIdsWithSelf: string[],
  generatorIdToScopesMap: GeneratorIdToScopesMap,
): Record<string, EntryDependencyRecord | undefined> {
  return mapValues(entry.task.dependencies ?? {}, (dep) => {
    const normalizedDep = dep.type === 'type' ? dep.dependency() : dep;
    const provider = normalizedDep.name;
    const { optional, exportName, isReadOnly, isOutput, useParentScope } =
      normalizedDep.options;

    // if the export name is empty and the dependency is optional, we can skip it
    if (exportName === '' && optional) {
      return;
    }

    const providerId = makeProviderId(provider, exportName);
    // find the closest parent task ID that offers the provider
    const entryIdsToCheck = useParentScope
      ? parentEntryIdsWithSelf.slice(0, -1)
      : parentEntryIdsWithSelf;
    const parentEntryId = entryIdsToCheck.findLast((id) =>
      generatorIdToScopesMap[id]?.providers.has(providerId),
    );

    const resolvedTaskId =
      parentEntryId &&
      generatorIdToScopesMap[parentEntryId]?.providers.get(providerId);

    if (!resolvedTaskId) {
      if (!optional || exportName) {
        throw new Error(
          `Could not resolve dependency ${provider}${exportName ? ` (${exportName})` : ''} for ${entry.id} (generator ${entry.generatorInfo.name})`,
        );
      }
      return;
    }

    if (resolvedTaskId === entry.id) {
      throw new Error(
        `Circular dependency detected for ${provider}${exportName ? ` (${exportName})` : ''} for ${entry.id} (generator ${entry.generatorInfo.name}).
         You can use the .parentScopeOnly() method to create a dependency that only resolves providers from the parent generator entry.`,
      );
    }

    return {
      id: resolvedTaskId,
      providerName: provider,
      options: {
        isReadOnly: isReadOnly ? true : undefined,
        isOutput: isOutput ? true : undefined,
      },
    };
  });
}

interface EntryDependencyRecord {
  id: string;
  providerName: string;
  options?: Pick<ProviderDependencyOptions, 'isReadOnly' | 'isOutput'>;
}

export type EntryDependencyMap = Record<
  string,
  Record<string, EntryDependencyRecord | null | undefined>
>;

/**
 * Builds a map of task entry ID to resolved providers for that entry recursively from the generator root entry
 *
 * @param entry Root generator entry
 * @param resolveableProvider Provider map of parents
 * @param flattenedTasks Flattened generator tasks
 * @param phase Task phase to resolve dependencies for
 * @param dynamicTaskEntries Dynamic task entries
 * @param logger Logger to use
 */
function buildEntryDependencyMapRecursive(
  entry: GeneratorEntry,
  parentEntryIds: string[],
  generatorIdToScopesMap: GeneratorIdToScopesMap,
  phase: TaskPhase | undefined,
  dynamicTaskEntries: Map<string, GeneratorTaskEntry[]> | undefined,
  logger: Logger,
): EntryDependencyMap {
  const parentChildIdsWithSelf = [...parentEntryIds, entry.id];
  const dynamicTasks = dynamicTaskEntries?.get(entry.id) ?? [];
  const entryDependencyMaps = mergeAllWithoutDuplicates(
    [...dynamicTasks, ...entry.tasks]
      .filter((taskEntry) => taskEntry.task.phase === phase)
      .map((taskEntry) => {
        const taskDependencyMap = buildTaskDependencyMap(
          taskEntry,
          parentChildIdsWithSelf,
          generatorIdToScopesMap,
        );

        return {
          [taskEntry.id]: taskDependencyMap,
        };
      }),
  );

  const childDependencyMaps = mergeAllWithoutDuplicates(
    entry.children.map((childEntry) =>
      buildEntryDependencyMapRecursive(
        childEntry,
        parentChildIdsWithSelf,
        generatorIdToScopesMap,
        phase,
        dynamicTaskEntries,
        logger,
      ),
    ),
  );

  return {
    ...childDependencyMaps,
    ...entryDependencyMaps,
  };
}

/**
 * Builds a map of generator ID to scopes with providers map
 *
 * @param rootEntry Root generator entry
 * @returns Generator ID to scopes map
 */
export function buildGeneratorIdToScopesMap(
  rootEntry: GeneratorEntry,
): GeneratorIdToScopesMap {
  const generatorIdToScopesMap: GeneratorIdToScopesMap = {};
  buildGeneratorIdToScopesMapRecursive(rootEntry, [], generatorIdToScopesMap);
  return generatorIdToScopesMap;
}

/**
 * Builds a map of task entry ID to resolved providers for that entry recursively from the generator root entry
 * for a specific task phase
 *
 * @param entry Root generator entry
 * @param generatorIdToScopesMap Generator ID to scopes map
 * @param phase Task phase to resolve dependencies for
 * @param dynamicTaskEntries Dynamic task entries
 * @param logger Logger to use
 */
export function resolveTaskDependenciesForPhase(
  rootEntry: GeneratorEntry,
  generatorIdToScopesMap: GeneratorIdToScopesMap,
  phase: TaskPhase | undefined,
  dynamicTaskEntries: Map<string, GeneratorTaskEntry[]> | undefined,
  logger: Logger,
): EntryDependencyMap {
  return buildEntryDependencyMapRecursive(
    rootEntry,
    [],
    generatorIdToScopesMap,
    phase,
    dynamicTaskEntries,
    logger,
  );
}
