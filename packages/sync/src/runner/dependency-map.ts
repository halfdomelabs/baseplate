import { mapValues, mergeWith } from 'es-toolkit';

import type { Logger } from '@src/utils/evented-logger.js';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from '../generators/index.js';
import type { ProviderDependencyOptions } from '../providers/index.js';

type GeneratorIdToScopesMap = Record<
  string,
  {
    // scopes offered by the generator
    scopes: string[];
    // providers within the scopes
    // key is JSON.encode([providerName(, exportName)])
    providers: Map<string, string>;
  }
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
  for (const task of entry.tasks) {
    const taskExports = Object.values(task.exports);
    const taskOutputs = Object.values(task.outputs);
    const invalidTaskExports = taskExports.filter(
      (taskExport) => taskExport.isOutput,
    );
    if (invalidTaskExports.length > 0) {
      throw new Error(
        `All providers in task exports must be non-output providers in ${task.id}: ${invalidTaskExports
          .map((taskExport) => taskExport.name)
          .join(', ')}`,
      );
    }
    const invalidTaskOutputs = taskOutputs.filter(
      (taskOutput) => !taskOutput.isOutput,
    );
    if (invalidTaskOutputs.length > 0) {
      throw new Error(
        `All providers in task outputs must be output providers in ${task.id}: ${invalidTaskOutputs
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
              generatorIdToScopesMap[id].scopes.includes(scope.name),
            )
          : entry.id;

        if (!parentTaskId) {
          throw new Error(
            `Could not find parent generator with scope ${scope?.name} at ${entry.id}`,
          );
        }

        const { providers } = generatorIdToScopesMap[parentTaskId];
        const providerId = makeProviderId(taskExport.name, exportName);

        const existingProviderId = providers.get(providerId);

        if (existingProviderId) {
          throw new Error(
            `Duplicate scoped provider export detected between ${entry.id} and ${existingProviderId} ` +
              `in scope (${scope?.name ?? 'default'}) at ${parentTaskId} for provider ${taskExport.name}. ` +
              `Please make sure that the provider export names are unique within the scope (and any other scopes at that level).`,
          );
        }
        providers.set(providerId, task.id);
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
  parentEntryIds: string[],
  generatorIdToScopesMap: GeneratorIdToScopesMap,
): Record<
  string,
  { id: string; options: ProviderDependencyOptions } | undefined
> {
  return mapValues(entry.dependencies, (dep) => {
    const normalizedDep = dep.type === 'type' ? dep.dependency() : dep;
    const provider = normalizedDep.name;
    const { optional, exportName, isReadOnly, isOutput } =
      normalizedDep.options;

    // if the export name is empty and the dependency is optional, we can skip it
    if (exportName === '' && optional) {
      return;
    }

    const providerId = makeProviderId(provider, exportName);
    // find the closest parent task ID that offers the provider
    const parentEntryId = parentEntryIds.findLast((id) =>
      generatorIdToScopesMap[id].providers.has(providerId),
    );

    const resolvedTaskId =
      parentEntryId &&
      generatorIdToScopesMap[parentEntryId].providers.get(providerId);

    if (!resolvedTaskId) {
      if (!optional || exportName) {
        throw new Error(
          `Could not resolve dependency ${provider}${exportName ? ` (${exportName})` : ''} for ${entry.id} (generator ${entry.generatorName})`,
        );
      }
      return;
    }

    return {
      id: resolvedTaskId,
      options: {
        isReadOnly: isReadOnly ? true : undefined,
        isOutput: isOutput ? true : undefined,
      },
    };
  });
}

export type EntryDependencyMap = Record<
  string,
  Record<
    string,
    | {
        id: string;
        options?: Pick<ProviderDependencyOptions, 'isReadOnly' | 'isOutput'>;
      }
    | null
    | undefined
  >
>;

/**
 * Builds a map of task entry ID to resolved providers for that entry recursively from the generator root entry
 *
 * @param entry Root generator entry
 * @param resolveableProvider Provider map of parents
 * @param flattenedTasks Flattened generator tasks
 * @param logger Logger to use
 */
function buildEntryDependencyMapRecursive(
  entry: GeneratorEntry,
  parentEntryIds: string[],
  generatorIdToScopesMap: GeneratorIdToScopesMap,
  logger: Logger,
): EntryDependencyMap {
  const entryDependencyMaps = mergeAllWithoutDuplicates(
    entry.tasks.map((task) => {
      const taskDependencyMap = buildTaskDependencyMap(
        task,
        parentEntryIds,
        generatorIdToScopesMap,
      );

      return {
        [task.id]: taskDependencyMap,
      };
    }),
  );

  const parentChildIdsWithSelf = [...parentEntryIds, entry.id];

  const childDependencyMaps = mergeAllWithoutDuplicates(
    entry.children.map((childEntry) =>
      buildEntryDependencyMapRecursive(
        childEntry,
        parentChildIdsWithSelf,
        generatorIdToScopesMap,
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
 * Builds a map of task entry ID to resolved providers for that entry recursively from the generator root entry
 *
 * @param entry Root generator entry
 * @param logger Logger to use
 */
export function resolveTaskDependencies(
  rootEntry: GeneratorEntry,
  logger: Logger,
): EntryDependencyMap {
  const generatorIdToScopesMap: GeneratorIdToScopesMap = {};
  buildGeneratorIdToScopesMapRecursive(rootEntry, [], generatorIdToScopesMap);

  return buildEntryDependencyMapRecursive(
    rootEntry,
    [],
    generatorIdToScopesMap,
    logger,
  );
}
