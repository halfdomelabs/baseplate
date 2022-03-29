import R from 'ramda';
import { ProviderDependencyOptions } from '../provider';
import { GeneratorEntry } from './generator-builder';
import { providerMapToNames } from './utils';

/**
 * Builds a map of the entry's dependencies to entry IDs of resolved providers
 *
 * @param entry Generator entry
 * @param parentProviders
 */
export function buildEntryDependencyMap(
  entry: GeneratorEntry,
  parentProviders: Record<string, string>,
  globalGeneratorMap: Record<string, GeneratorEntry>
): Record<string, string | null> {
  return R.mapObjIndexed((dep) => {
    const provider = dep.name;
    const { optional, reference } =
      dep.type === 'dependency'
        ? dep.options
        : ({} as ProviderDependencyOptions);

    if (reference) {
      const referencedGenerator = globalGeneratorMap[reference];
      if (!referencedGenerator) {
        // TODO: Remove debug helpers
        const generatorKeys = Object.keys(globalGeneratorMap);
        const file = reference.split(':')[0];
        const generatorsInFile = generatorKeys.filter((key) =>
          key.startsWith(file)
        );
        console.error(`Generator IDs in file: ${generatorsInFile.join('\n')}`);
        throw new Error(
          `Could not resolve dependency reference ${reference} for ${entry.id}`
        );
      }
      // validate referenced generator exports required provider
      const generatorProviders = providerMapToNames(
        referencedGenerator.exports
      );
      if (!generatorProviders.includes(provider)) {
        throw new Error(
          `${reference} does not implement ${provider} required in ${entry.id}`
        );
      }

      return reference;
    }

    if (!parentProviders[provider]) {
      if (!optional) {
        throw new Error(
          `Could not resolve dependency ${provider} for ${entry.id}`
        );
      }
      return null;
    }

    return parentProviders[provider];
  }, entry.dependencies);
}

export type EntryDependencyMap = Record<string, Record<string, string | null>>;

function buildHoistedProviderMap(
  entry: GeneratorEntry,
  providers: string[]
): Record<string, string> {
  if (!providers.length) {
    return {};
  }

  const matchingProviders = providerMapToNames(entry.exports).filter((name) =>
    providers.includes(name)
  );
  const matchingProviderMap = matchingProviders.reduce(
    (acc, name) => ({ ...acc, [name]: entry.id }),
    {} as Record<string, string>
  );

  const safeMerge = R.mergeWithKey((key) => {
    throw new Error(
      `Duplicate hoisted provider (${key}) detected at ${entry.id}`
    );
  });
  const hoistedChildProviders = entry.children.map((child) =>
    buildHoistedProviderMap(child, providers)
  );
  const hoistedProviders: Record<string, string> = R.reduce(
    safeMerge,
    matchingProviderMap,
    hoistedChildProviders
  );

  return hoistedProviders;
}

/**
 * Builds a map of entry ID to resolved providers for that entry recursively from the root entry
 *
 * @param entry Root generator entry
 * @param parentProviders Provider map of parents
 * @param globalGeneratorMap Global generator map
 */
export function buildEntryDependencyMapRecursive(
  entry: GeneratorEntry,
  parentProviders: Record<string, string>,
  globalGeneratorMap: Record<string, GeneratorEntry>
): EntryDependencyMap {
  const entryDependencyMap = buildEntryDependencyMap(
    entry,
    parentProviders,
    globalGeneratorMap
  );

  // force formatter to be optionally added since it's used by most generators
  const { formatter } = parentProviders;
  if (entryDependencyMap.formatter) {
    throw new Error(
      `formatter cannot be set as a dependency (it is automatically set) for ${entry.id}`
    );
  }
  if (formatter && !providerMapToNames(entry.exports).includes('formatter')) {
    entryDependencyMap.formatter = formatter;
  }

  // get all the peer providers from the children and providers from self
  const childProviderArrays = entry.children
    .filter((g) => g.descriptor.peerProvider)
    .map((g) =>
      providerMapToNames(g.exports).map((name) => ({ [name]: g.id }))
    );

  const safeMerge = R.mergeWithKey((key) => {
    throw new Error(`Duplicate provider (${key}) detected at ${entry.id}`);
  });
  const childProviders: Record<string, string> = R.reduce(
    safeMerge,
    {},
    R.flatten(childProviderArrays)
  );

  const selfProviders = R.mergeAll(
    providerMapToNames(entry.exports).map((name) => ({
      [name]: entry.id,
    }))
  );

  const hoistedProviders = buildHoistedProviderMap(
    entry,
    entry.descriptor.hoistedProviders || []
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
        globalGeneratorMap
      )
    )
  );

  return {
    ...childDependencyMaps,
    [entry.id]: entryDependencyMap,
  };
}
