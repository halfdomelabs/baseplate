import R from 'ramda';
import { FormatterProvider } from '@src/providers';
import { GeneratorInstance } from '../generator';
import { GeneratorOutput, OutputBuilder } from '../generator-output';
import { Provider } from '../provider';
import { buildEntryDependencyMapRecursive } from './dependency-map';
import { getSortedEntryIds } from './dependency-sort';
import { GeneratorEntry } from './generator-builder';
import { flattenGeneratorEntries } from './utils';

// running awaits in serial for ease of reading

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

export async function executeGeneratorEntry(
  rootEntry: GeneratorEntry
): Promise<GeneratorOutput> {
  const entries = flattenGeneratorEntries(rootEntry);
  const entriesById = R.indexBy(R.prop('id'), entries);
  const dependencyMap = buildEntryDependencyMapRecursive(rootEntry, {}, {});
  const sortedEntryIds = getSortedEntryIds(entries, dependencyMap);

  // Phase 1: Initialize providers (beginning at the bottom of dependency tree)

  const generatorsById: Record<string, GeneratorInstance> = {}; // map of entry ID to initialized generator
  const providerMapById: Record<string, Record<string, Provider>> = {}; // map of entry ID to map of provider name to Provider
  for (const entryId of sortedEntryIds) {
    const { descriptor, generatorConfig, dependencies, exports } =
      entriesById[entryId];

    const resolvedDependencies = R.mapObjIndexed((dependency, key) => {
      const dependencyId = dependencyMap[entryId][key];
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
          `Could not resolve required dependency ${key} in ${entryId}`
        );
      }
      return provider as Provider; // cheat Type system to prevent null from appearing
    }, dependencies);

    const generator = generatorConfig.createGenerator(
      descriptor,
      resolvedDependencies
    );
    generatorsById[entryId] = generator;

    if (!generator.getProviders && exports && Object.keys(exports).length) {
      throw new Error(
        `Generator ${entryId} does not have getProviders function despite having exports`
      );
    }
    if (generator.getProviders && exports) {
      const providers = generator.getProviders();
      const missingProvider = Object.keys(exports).find(
        (key) => !providers[key]
      );
      if (missingProvider) {
        throw new Error(
          `Generator ${entryId} did not export provider ${missingProvider}`
        );
      }
      providerMapById[entryId] = R.zipObj(
        Object.values(exports).map((value) => value.name),
        Object.keys(exports).map((key) => providers[key])
      );
    }
  }

  // Phase 2: Execute generators to get output
  const generatorOutputs: GeneratorOutput[] = [];
  for (const entryId of R.reverse(sortedEntryIds)) {
    const entry = entriesById[entryId];
    const generator = generatorsById[entryId];

    // get default formatter for this instance
    const formatterId = dependencyMap[entryId].formatter;
    const formatter =
      formatterId == null
        ? undefined
        : (providerMapById[formatterId]
            .formatter as unknown as FormatterProvider);

    const outputBuilder = new OutputBuilder(
      entry.generatorConfig.configBaseDirectory,
      formatter
    );

    await Promise.resolve(generator.build(outputBuilder));

    generatorOutputs.push(outputBuilder.output);
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
