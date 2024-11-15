import * as R from 'ramda';

import type { FormatterProvider } from '@src/providers/index.js';
import type { Logger } from '@src/utils/evented-logger.js';

import { safeMergeMap } from '@src/utils/merge.js';

import type { GeneratorOutput } from '../generator-output.js';
import type { GeneratorTaskInstance } from '../generator.js';
import type { Provider } from '../provider.js';
import type { GeneratorEntry } from './generator-builder.js';

import { OutputBuilder } from '../generator-output.js';
import { buildEntryDependencyMapRecursive as buildTaskEntryDependencyMapRecursive } from './dependency-map.js';
import { getSortedRunSteps } from './dependency-sort.js';
import { flattenGeneratorTaskEntries } from './utils.js';

// running awaits in serial for ease of reading

export async function executeGeneratorEntry(
  rootEntry: GeneratorEntry,
  logger: Logger,
): Promise<GeneratorOutput> {
  const taskEntries = flattenGeneratorTaskEntries(rootEntry);
  const taskEntriesById = R.indexBy(R.prop('id'), taskEntries);
  const dependencyMap = buildTaskEntryDependencyMapRecursive(
    rootEntry,
    {},
    taskEntriesById,
    logger,
  );
  const sortedRunSteps = getSortedRunSteps(taskEntries, dependencyMap);

  const taskInstanceById: Record<string, GeneratorTaskInstance> = {}; // map of entry ID to initialized generator
  const providerMapById: Record<string, Record<string, Provider>> = {}; // map of entry ID to map of provider name to Provider

  const generatorOutputs: GeneratorOutput[] = [];

  for (const runStep of sortedRunSteps) {
    const [action, taskId] = runStep.split('|');
    try {
      if (action === 'init') {
        // run through init step
        const { task, dependencies, exports } = taskEntriesById[taskId];

        const resolvedDependencies = R.mapObjIndexed((dependency, key) => {
          const dependencyId = dependencyMap[taskId][key]?.id;

          const provider =
            dependencyId == null
              ? null
              : providerMapById[dependencyId][dependency.name];
          const { optional } =
            dependency.type === 'dependency'
              ? dependency.options
              : { optional: false };

          if (!provider && !optional) {
            throw new Error(
              `Could not resolve required dependency ${key} in ${taskId}`,
            );
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return provider!; // cheat Type system to prevent null from appearing
        }, dependencies);

        const taskInstance = task.run(resolvedDependencies);
        taskInstanceById[taskId] = taskInstance;

        if (!taskInstance.getProviders && Object.keys(exports).length > 0) {
          throw new Error(
            `Task ${taskId} does not have getProviders function despite having exports`,
          );
        }
        if (taskInstance.getProviders) {
          const providers = taskInstance.getProviders();
          const missingProvider = Object.keys(exports).find(
            (key) => !(key in providers),
          );
          if (missingProvider) {
            throw new Error(
              `Task ${taskId} did not export provider ${missingProvider}`,
            );
          }
          providerMapById[taskId] = R.zipObj(
            Object.values(exports).map((value) => value.name),
            Object.keys(exports).map((key) => providers[key]),
          );
        }
      } else if (action === 'build') {
        // run through build step
        const entry = taskEntriesById[taskId];
        const generator = taskInstanceById[taskId];

        // get default formatter for this instance
        const formatterId = dependencyMap[taskId].formatter?.id;
        const formatter =
          formatterId == null
            ? undefined
            : (providerMapById[formatterId]
                .formatter as unknown as FormatterProvider);

        const outputBuilder = new OutputBuilder(
          entry.generatorBaseDirectory,
          formatter,
        );

        if (generator.build) {
          await Promise.resolve(generator.build(outputBuilder));
        }

        generatorOutputs.push(outputBuilder.output);
      } else {
        throw new Error(`Unknown action ${action}`);
      }
    } catch (error) {
      const { generatorName } = taskEntriesById[taskId];
      logger.error(
        `Error encountered in ${action} step of ${taskId} (${generatorName})`,
      );
      throw error;
    }
  }

  const buildOutput: GeneratorOutput = {
    files: safeMergeMap(...generatorOutputs.map((output) => output.files)),
    postWriteCommands: generatorOutputs.flatMap(
      (output) => output.postWriteCommands,
    ),
  };

  return buildOutput;
}
