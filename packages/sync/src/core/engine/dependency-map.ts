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
        if (!optional) {
          throw new Error(
            `Could not resolve dependency reference ${reference} for ${entry.id}`
          );
        }
        return null;
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

  const providerMap = {
    ...parentProviders,
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
