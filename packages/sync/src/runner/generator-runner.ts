import * as R from 'ramda';

import type { Logger } from '@src/utils/evented-logger.js';

import { safeMergeMap } from '@src/utils/merge.js';

import type {
  GeneratorEntry,
  GeneratorTaskResult,
} from '../generators/index.js';
import type { GeneratorOutput, GeneratorTaskOutput } from '../output/index.js';
import type { Provider } from '../providers/index.js';

import { GeneratorTaskOutputBuilder } from '../output/index.js';
import { resolveTaskDependencies } from './dependency-map.js';
import { getSortedRunSteps } from './dependency-sort.js';
import { flattenGeneratorTaskEntries } from './utils.js';

export async function executeGeneratorEntry(
  rootEntry: GeneratorEntry,
  logger: Logger,
): Promise<GeneratorOutput> {
  const taskEntries = flattenGeneratorTaskEntries(rootEntry);
  const taskEntriesById = R.indexBy(R.prop('id'), taskEntries);
  const dependencyMap = resolveTaskDependencies(rootEntry, logger);
  const { steps: sortedRunSteps, metadata } = getSortedRunSteps(
    taskEntries,
    dependencyMap,
  );

  const taskInstanceById: Record<string, GeneratorTaskResult> = {}; // map of entry ID to initialized generator
  const providerMapById: Record<string, Record<string, Provider>> = {}; // map of entry ID to map of provider name to Provider

  const generatorOutputs: GeneratorTaskOutput[] = [];

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

        const { getProviders } = taskInstance;

        if (!getProviders && Object.keys(exports).length > 0) {
          throw new Error(
            `Task ${taskId} does not have providers despite having exports`,
          );
        }
        if (getProviders) {
          const providers = getProviders();
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

        const outputBuilder = new GeneratorTaskOutputBuilder(
          entry.generatorBaseDirectory,
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
    globalFormatters: generatorOutputs.flatMap(
      (output) => output.globalFormatters,
    ),
    metadata: {
      generatorStepNodes: metadata.fullSteps.map((step) => ({
        id: step,
        label: step,
      })),
      generatorStepEdges: metadata.fullEdges.map(([source, target]) => ({
        id: `${source}->${target}`,
        source,
        target,
      })),
    },
  };

  return buildOutput;
}
