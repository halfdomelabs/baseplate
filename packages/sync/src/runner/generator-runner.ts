import { mapGroupBy } from '@halfdomelabs/utils';
import { keyBy, mapValues } from 'es-toolkit';

import type { Logger } from '@src/utils/evented-logger.js';

import { sortTaskPhases } from '@src/phases/sort-task-phases.js';
import { findDuplicates } from '@src/utils/find-duplicates.js';
import { safeMergeMap } from '@src/utils/merge.js';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
  GeneratorTaskResult,
} from '../generators/index.js';
import type {
  GeneratorOutput,
  GeneratorOutputMetadata,
  GeneratorTaskOutput,
} from '../output/index.js';
import type { Provider } from '../providers/index.js';

import { GeneratorTaskOutputBuilder } from '../output/index.js';
import {
  buildGeneratorIdToScopesMap,
  resolveTaskDependenciesForPhase,
} from './dependency-map.js';
import { getSortedRunSteps } from './dependency-sort.js';
import { runInRunnerContext } from './runner-context.js';
import { flattenGeneratorTaskEntriesAndPhases } from './utils.js';

/**
 * Options for writing template metadata
 */
export interface TemplateMetadataWriterOptions {
  /**
   * Whether to write template metadata
   */
  enabled: boolean;
  /**
   * Generator names to exclude from writing template metadata
   */
  excludeGeneratorNames?: string[];
}

/**
 * Options for executing a generator entry
 */
export interface ExecuteGeneratorEntryOptions {
  logger: Logger;
  templateMetadataWriter?: TemplateMetadataWriterOptions;
}

export async function executeGeneratorEntry(
  rootEntry: GeneratorEntry,
  { logger, templateMetadataWriter }: ExecuteGeneratorEntryOptions,
): Promise<GeneratorOutput> {
  const { taskEntries, phases } =
    flattenGeneratorTaskEntriesAndPhases(rootEntry);
  const sortedPhases = sortTaskPhases(phases);
  const taskEntriesById = keyBy(taskEntries, (item) => item.id);
  // build a map of generators to their scoped exports
  const generatorIdToScopesMap = buildGeneratorIdToScopesMap(rootEntry);

  const taskInstanceById: Record<string, GeneratorTaskResult> = {}; // map of entry ID to initialized generator
  const providerMapById: Record<string, Record<string, Provider>> = {}; // map of entry ID to map of provider name to Provider

  const generatorOutputs: GeneratorTaskOutput[] = [];
  const generatorTaskMetadatas: GeneratorOutputMetadata[] = [];

  // map of phases to generator ID to task entries that are dynamically added
  const dynamicTaskEntriesByPhase = new Map<
    string,
    Map<string, GeneratorTaskEntry[]>
  >();

  for (const phase of [undefined, ...sortedPhases]) {
    const currentDynamicTaskEntries = dynamicTaskEntriesByPhase.get(
      phase?.name ?? '',
    );

    const dependencyMap = resolveTaskDependenciesForPhase(
      rootEntry,
      generatorIdToScopesMap,
      phase,
      currentDynamicTaskEntries,
      logger,
    );
    const filteredTaskEntries = taskEntries.filter(
      (taskEntry) => taskEntry.task.phase === phase,
    );
    const { steps: sortedRunSteps, metadata } = getSortedRunSteps(
      [
        ...filteredTaskEntries,
        ...(currentDynamicTaskEntries
          ? [...currentDynamicTaskEntries.values()].flat()
          : []),
      ],
      dependencyMap,
    );
    generatorTaskMetadatas.push(metadata);
    for (const runStep of sortedRunSteps) {
      const [action, taskId] = runStep.split('|');
      try {
        const { task, generatorId } = taskEntriesById[taskId];
        const { dependencies = {}, exports = {}, outputs = {} } = task;
        if (action === 'init') {
          // run through init step

          const resolvedDependencies = mapValues(
            dependencies,
            (dependency, key) => {
              const dependencyId = dependencyMap[taskId][key]?.id;

              const provider =
                dependencyId === undefined
                  ? undefined
                  : providerMapById[dependencyId][dependency.name];
              const { isReadOnly } = dependency;
              const { optional } =
                dependency.type === 'dependency'
                  ? dependency.options
                  : { optional: false };

              // check dependency comes from a previous phase
              if (phase !== undefined && dependencyId) {
                const dependencyTask = taskEntriesById[dependencyId];
                if (dependencyTask.task.phase !== phase) {
                  if (!isReadOnly) {
                    throw new Error(
                      `Dependency ${key} in ${taskId} cannot come from a previous phase since it is not read-only`,
                    );
                  }
                  if (
                    dependencyTask.task.phase &&
                    !phase.options.consumesOutputFrom?.includes(
                      dependencyTask.task.phase,
                    )
                  ) {
                    throw new Error(
                      `Dependency ${key} in ${taskId} cannot come from phase ${dependencyTask.task.phase.name} unless it is explicitly defined in consumesOutputFrom`,
                    );
                  }
                }
              }

              if (!provider && !optional) {
                throw new Error(
                  `Could not resolve required dependency ${key} in ${taskId}`,
                );
              }
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return provider!; // cheat Type system to prevent null from appearing
            },
          );

          const taskInstance = runInRunnerContext<
            GeneratorTaskResult | undefined
          >({ taskId }, () =>
            task.run(resolvedDependencies, {
              taskId,
            }),
          ) ?? { providers: {} };
          taskInstanceById[taskId] = taskInstance;

          const { providers } = taskInstance;

          if (!providers && Object.keys(exports).length > 0) {
            throw new Error(
              `Task ${taskId} does not have providers despite having exports`,
            );
          }
          if (providers) {
            const missingProvider = Object.keys(exports).find(
              (key) => !(key in providers),
            );
            if (missingProvider) {
              throw new Error(
                `Task ${taskId} did not output provider ${missingProvider}`,
              );
            }
            providerMapById[taskId] = Object.fromEntries(
              Object.entries(exports).map(([key, value]) => [
                value.name,
                providers[key],
              ]),
            );
          }
        } else if (action === 'build') {
          // run through build step
          const entry = taskEntriesById[taskId];
          const generator = taskInstanceById[taskId];

          const outputBuilder = new GeneratorTaskOutputBuilder({
            generatorInfo: entry.generatorInfo,
            generatorId: entry.generatorId,
            includeTemplateMetadata:
              templateMetadataWriter?.enabled &&
              !templateMetadataWriter.excludeGeneratorNames?.includes(
                entry.generatorInfo.name,
              ),
          });

          if (generator.build) {
            const outputResult =
              ((await Promise.resolve(
                runInRunnerContext({ taskId }, () =>
                  generator.build?.(outputBuilder),
                ),
              )) as Record<string, Provider> | undefined) ?? {};

            const outputKeys = Object.keys(outputs);
            if (outputKeys.length > 0) {
              const missingProvider = Object.keys(outputs).find(
                (key) => !(key in outputResult),
              );
              if (missingProvider) {
                throw new Error(
                  `Task ${taskId} did not export provider ${missingProvider}`,
                );
              }
              providerMapById[taskId] = {
                ...providerMapById[taskId],
                ...Object.fromEntries(
                  Object.entries(outputs).map(([key, value]) => [
                    value.name,
                    outputResult[key],
                  ]),
                ),
              };
            }
          }

          // validate dynamic tasks fulfill the requirements
          const { dynamicTasks } = outputBuilder;

          for (const dynamicTask of dynamicTasks) {
            if (dynamicTask.id in taskEntriesById) {
              throw new Error(
                `Cannot add dynamic task with the same name as a static task: ${dynamicTask.id}`,
              );
            }
            if (
              !dynamicTask.task.phase ||
              (phase &&
                !phase.options.addsDynamicTasksTo?.includes(
                  dynamicTask.task.phase,
                ))
            ) {
              throw new Error(
                `Dynamic task ${dynamicTask.id} must have an explicit phase and be added to the addsDynamicTasksTo option of the phase ${phase?.name}`,
              );
            }
            if (!sortedPhases.includes(dynamicTask.task.phase)) {
              throw new Error(
                `Could not find phase ${dynamicTask.task.phase.name} in the task phases. Make sure it is registered ahead of time.`,
              );
            }
            // register it in the ID map
            taskEntriesById[dynamicTask.id] = dynamicTask;
          }

          // group dynamic tasks by phase and add them to dynamicTaskEntriesByPhase
          const dynamicTasksByPhase = mapGroupBy(
            dynamicTasks,
            (task) => task.task.phase?.name ?? '',
          );
          for (const [
            phaseName,
            dynamicTasksOfPhase,
          ] of dynamicTasksByPhase.entries()) {
            const dynamicTaskEntries =
              dynamicTaskEntriesByPhase.get(phaseName) ??
              new Map<string, GeneratorTaskEntry[]>();
            dynamicTaskEntries.set(generatorId, dynamicTasksOfPhase);
            dynamicTaskEntriesByPhase.set(phaseName, dynamicTaskEntries);
          }

          generatorOutputs.push(outputBuilder.output);
        } else {
          throw new Error(`Unknown action ${action}`);
        }
      } catch (error) {
        const { generatorInfo } = taskEntriesById[taskId];
        logger.error(
          `Error encountered in ${action} step of ${taskId} (${generatorInfo.name})`,
        );
        throw error;
      }
    }
  }

  const buildOutput: GeneratorOutput = {
    files: safeMergeMap(...generatorOutputs.map((output) => output.files)),
    postWriteCommands: generatorOutputs.flatMap(
      (output) => output.postWriteCommands,
    ),
    globalFormatters: generatorOutputs.flatMap(
      (output) => output.globalFormatters,
    ),
    metadata: {
      generatorProviderRelationships: generatorTaskMetadatas.flatMap(
        (metadata) => metadata.generatorProviderRelationships,
      ),
      generatorTaskEntries: generatorTaskMetadatas.flatMap(
        (metadata) => metadata.generatorTaskEntries,
      ),
    },
  };

  // verify no file IDs are duplicated
  const fileIds = Array.from(buildOutput.files.values(), (file) => file.id);
  const duplicateFileIds = findDuplicates(fileIds);
  if (duplicateFileIds.length > 0) {
    throw new Error(`Duplicate file IDs found: ${duplicateFileIds.join(', ')}`);
  }

  return buildOutput;
}
