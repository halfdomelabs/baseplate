import R from 'ramda';
import { FormatterProvider } from '@src/providers';
import { Logger } from '@src/utils/evented-logger';
import { GeneratorTaskInstance } from '../generator';
import { GeneratorOutput, OutputBuilder } from '../generator-output';
import { Provider } from '../provider';
import { buildEntryDependencyMapRecursive as buildTaskEntryDependencyMapRecursive } from './dependency-map';
import { getSortedRunSteps } from './dependency-sort';
import { GeneratorEntry } from './generator-builder';
import { flattenGeneratorTaskEntries } from './utils';

// running awaits in serial for ease of reading

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

export async function executeGeneratorEntry(
  rootEntry: GeneratorEntry,
  logger: Logger
): Promise<GeneratorOutput> {
  const taskEntries = flattenGeneratorTaskEntries(rootEntry);
  const taskEntriesById = R.indexBy(R.prop('id'), taskEntries);
  const dependencyMap = buildTaskEntryDependencyMapRecursive(
    rootEntry,
    {},
    taskEntriesById,
    logger
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
              `Could not resolve required dependency ${key} in ${taskId}`
            );
          }
          return provider as Provider; // cheat Type system to prevent null from appearing
        }, dependencies);

        const taskInstance = task.run(resolvedDependencies);
        taskInstanceById[taskId] = taskInstance;

        if (
          !taskInstance.getProviders &&
          exports &&
          Object.keys(exports).length
        ) {
          throw new Error(
            `Task ${taskId} does not have getProviders function despite having exports`
          );
        }
        if (taskInstance.getProviders && exports) {
          const providers = taskInstance.getProviders();
          const missingProvider = Object.keys(exports).find(
            (key) => !providers[key]
          );
          if (missingProvider) {
            throw new Error(
              `Task ${taskId} did not export provider ${missingProvider}`
            );
          }
          providerMapById[taskId] = R.zipObj(
            Object.values(exports).map((value) => value.name),
            Object.keys(exports).map((key) => providers[key])
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
          formatter
        );

        await Promise.resolve(generator.build(outputBuilder));

        generatorOutputs.push(outputBuilder.output);
      } else {
        throw new Error(`Unknown action ${action}`);
      }
    } catch (err) {
      const { generatorName } = taskEntriesById[taskId];
      logger.error(
        `Error encountered in ${action} step of ${taskId} (${generatorName})`
      );
      throw err;
    }
  }

  const safeMerge = R.mergeWithKey((key) => {
    throw new Error(
      `Two or more generators attempted to write to the same file (${key})`
    );
  });

  const buildOutput: GeneratorOutput = {
    files: R.reduce(
      safeMerge,
      {},
      generatorOutputs.map((output) => output.files)
    ),
    postWriteCommands: R.flatten(
      R.reverse(generatorOutputs.map((output) => output.postWriteCommands))
    ),
  };

  return buildOutput;
}
