import * as R from 'ramda';

import type { Logger } from '@src/utils/evented-logger.js';

import type { ProviderDependencyOptions } from '../provider.js';
import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from './generator-builder.js';

import { getGeneratorEntryExportNames, providerMapToNames } from './utils.js';

/**
 * Builds a map of the entry's dependencies to entry IDs of resolved providers
 *
 * @param entry Generator entry
 * @param parentProviders
 */
export function buildTaskDependencyMap(
  entry: GeneratorTaskEntry,
  parentProviders: Record<string, string>,
  globalGeneratorTaskMap: Record<string, GeneratorTaskEntry>,
  logger: Logger,
): Record<
  string,
  { id: string; options: ProviderDependencyOptions } | null | undefined
> {
  return R.mapObjIndexed((dep) => {
    const normalizedDep = dep.type === 'type' ? dep.dependency() : dep;
    const provider = normalizedDep.name;
    const { optional, reference, resolveToNull } = normalizedDep.options;

    if (resolveToNull) {
      return null;
    }

    if (reference) {
      // TODO: Use better search algorithm

      // looks for all tasks within the referenced generator that have the required export
      const referencedTaskIds = Object.keys(globalGeneratorTaskMap).filter(
        (key) => key.startsWith(`${reference}#`),
      );
      const referencedTaskId = referencedTaskIds.find((key) =>
        providerMapToNames(globalGeneratorTaskMap[key].exports).includes(
          provider,
        ),
      );

      if (!referencedTaskId) {
        // TODO: Remove debug helpers
        const taskKeys = Object.keys(globalGeneratorTaskMap);
        const file = reference.split(':')[0];
        const tasksInFile = taskKeys.filter((key) => key.startsWith(file));
        logger.error(`Task IDs in file: ${tasksInFile.join('\n')}`);
        throw new Error(
          `Could not resolve dependency reference ${reference} for ${entry.id}`,
        );
      }

      const referencedTask = globalGeneratorTaskMap[referencedTaskId];
      // validate referenced generator exports required provider
      const taskProviders = providerMapToNames(referencedTask.exports);
      if (!taskProviders.includes(provider)) {
        throw new Error(
          `${reference} does not implement ${provider} required in ${entry.id}`,
        );
      }

      return { id: referencedTaskId, options: normalizedDep.options };
    }

    if (!parentProviders[provider]) {
      if (!optional) {
        throw new Error(
          `Could not resolve dependency ${provider} for ${entry.id}`,
        );
      }
      return null;
    }

    return { id: parentProviders[provider], options: normalizedDep.options };
  }, entry.dependencies);
}

export type EntryDependencyMap = Record<
  string,
  Record<
    string,
    { id: string; options?: ProviderDependencyOptions } | null | undefined
  >
>;

function buildHoistedProviderMap(
  entry: GeneratorEntry,
  providers: string[],
): Record<string, string> {
  if (providers.length === 0) {
    return {};
  }

  const matchingProviderMap = R.mergeAll(
    entry.tasks.map((task) =>
      Object.fromEntries(
        providerMapToNames(task.exports)
          .filter((name) => providers.includes(name))
          .map((name) => [name, task.id]),
      ),
    ),
  );

  const safeMerge = R.mergeWithKey((key) => {
    throw new Error(
      `Duplicate hoisted provider (${key}) detected at ${entry.id}`,
    );
  });
  const hoistedChildProviders = entry.children.map((child) =>
    buildHoistedProviderMap(child, providers),
  );
  const hoistedProviders: Record<string, string> = R.reduce(
    safeMerge,
    matchingProviderMap,
    hoistedChildProviders,
  );

  return hoistedProviders;
}

/**
 * Builds a map of task entry ID to resolved providers for that entry recursively from the generator root entry
 *
 * @param entry Root generator entry
 * @param parentProviders Provider map of parents
 * @param globalTaskMap Global generator map
 */
export function buildEntryDependencyMapRecursive(
  entry: GeneratorEntry,
  parentProviders: Record<string, string>,
  globalTaskMap: Record<string, GeneratorTaskEntry>,
  logger: Logger,
): EntryDependencyMap {
  const entryDependencyMaps = R.mergeAll(
    entry.tasks.map((task) => {
      const taskDependencyMap = buildTaskDependencyMap(
        task,
        parentProviders,
        globalTaskMap,
        logger,
      );

      return {
        [task.id]: taskDependencyMap,
      };
    }),
  );

  // get all the peer providers from the children and providers from self
  const childProviderArrays = entry.children
    .filter((g) => g.descriptor.peerProvider)
    .map((g) =>
      g.tasks.map((task) =>
        providerMapToNames(task.exports).map((name) => ({ [name]: task.id })),
      ),
    );

  const safeMerge = R.mergeWithKey((key) => {
    throw new Error(`Duplicate provider (${key}) detected at ${entry.id}`);
  });
  const childProviders: Record<string, string> = R.reduce(
    safeMerge,
    {},
    R.flatten(childProviderArrays),
  );

  const selfProviders = R.reduce(
    safeMerge,
    {},
    entry.tasks.flatMap((task) =>
      providerMapToNames(task.exports).map((name) => ({
        [name]: task.id,
      })),
    ),
  );

  const hoistedProviders = buildHoistedProviderMap(
    entry,
    entry.descriptor.hoistedProviders ?? [],
  );

  const providerMap = {
    ...parentProviders,
    ...hoistedProviders,
    ...selfProviders,
    ...childProviders,
  };

  const childDependencyMaps = R.mergeAll(
    entry.children.map((childEntry) =>
      buildEntryDependencyMapRecursive(
        childEntry,
        providerMap,
        globalTaskMap,
        logger,
      ),
    ),
  );

  return {
    ...childDependencyMaps,
    ...entryDependencyMaps,
  };
}
