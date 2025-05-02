import { toposortLocal } from '@halfdomelabs/utils';
import { isEqual, keyBy, uniqWith } from 'es-toolkit';

import type { TsCodeFragment } from '../fragments/types.js';

import { mergeFragmentImportsAndHoistedFragments } from './ts-code-utils.js';

/**
 * A code fragment with dependencies.
 */
export interface TsCodeFragmentWithDependencies {
  /**
   * The name of the code fragment (typically the value it exports to the global scope).
   */
  name: string;
  /**
   * The code fragment.
   */
  fragment: TsCodeFragment;
  /**
   * The dependencies of the code fragment.
   */
  dependencies?: TsCodeFragmentWithDependencies[];
}

interface FlattenedCodeFragmentWithDependenciesResult {
  fragmentsWithDependencies: TsCodeFragmentWithDependencies[];
  dependencies: [string, string][];
}

function flattenCodeFragmentWithDependencies(
  fragment: TsCodeFragmentWithDependencies,
): FlattenedCodeFragmentWithDependenciesResult {
  const fragmentsWithDependencies: TsCodeFragmentWithDependencies[] = [
    fragment,
  ];
  const dependencies: [string, string][] =
    fragment.dependencies?.map((d) => [d.name, fragment.name]) ?? [];

  for (const dependency of fragment.dependencies ?? []) {
    const flattened = flattenCodeFragmentWithDependencies(dependency);
    fragmentsWithDependencies.push(...flattened.fragmentsWithDependencies);
    dependencies.push(...flattened.dependencies);
  }

  return {
    fragmentsWithDependencies,
    dependencies,
  };
}

function flattenCodeFragmentsWithDependencies(
  fragments: TsCodeFragmentWithDependencies[],
): FlattenedCodeFragmentWithDependenciesResult {
  const fragmentsWithDependencies: TsCodeFragmentWithDependencies[] = [];
  const dependencies: [string, string][] = [];

  for (const fragment of fragments) {
    const flattened = flattenCodeFragmentWithDependencies(fragment);
    fragmentsWithDependencies.push(...flattened.fragmentsWithDependencies);
    dependencies.push(...flattened.dependencies);
  }

  const uniqueFragmentsWithDependencies = uniqWith(
    fragmentsWithDependencies,
    (a, b) => {
      if (a.name === b.name) {
        if (!isEqual(a.fragment, b.fragment)) {
          throw new Error(
            `Duplicate hoisted fragment key ${a.name} with different contents`,
          );
        }
        return true;
      }
      return false;
    },
  );

  return {
    fragmentsWithDependencies: uniqueFragmentsWithDependencies,
    dependencies,
  };
}

/**
 * Merges a list of code fragments with dependencies colocated near their usage points
 * rather than hoisted to the top of the file.
 *
 * This places associated fragments (like type definitions) adjacent to the code fragments
 * that use them, which improves code organization in dynamically generated files like
 * service files with multiple service functions.
 *
 * @param fragments - The list of code fragments to merge
 * @param separator - The separator to use between fragments
 * @param options - The options for the merge
 * @param options.preserveOrder - Whether to preserve the order of the fragments otherwise they will be sorted alphabetically by name
 * @returns A new code fragment with the merged imports and hoisted fragments ordered by lexical closeness/topological sort
 */
export function mergeFragmentsWithColocatedDependencies(
  rootFragments: TsCodeFragmentWithDependencies[],
  separator = '\n\n',
  options?: { preserveOrder?: boolean },
): TsCodeFragment {
  const { fragmentsWithDependencies, dependencies } =
    flattenCodeFragmentsWithDependencies(rootFragments);

  const flattenedFragmentsByName = keyBy(
    fragmentsWithDependencies,
    (f) => f.name,
  );

  function getFragmentOrderKey(name: string): string {
    const fragment = flattenedFragmentsByName[name];
    // if it's a root fragment, return the index of the fragment if preserving order or
    // the name otherwise
    if (rootFragments.includes(fragment)) {
      const rootFragmentKey = options?.preserveOrder
        ? rootFragments.indexOf(fragment)
        : name;
      // we use a prefix of 0 to make sure that dependent fragments are pushed closer to their root fragment
      return `0-${rootFragmentKey}`;
    }
    // if it's a dependency, return the name of the fragment
    return `1-${name}`;
  }

  const sortedFragmentNames = toposortLocal(
    fragmentsWithDependencies.map((f) => f.name),
    dependencies,
    {
      compareFunc: (a, b) => {
        const aKey = getFragmentOrderKey(a);
        const bKey = getFragmentOrderKey(b);
        return aKey.localeCompare(bKey);
      },
    },
  );
  const sortedFragments = sortedFragmentNames.map(
    (name) => flattenedFragmentsByName[name].fragment,
  );

  return {
    contents: sortedFragments.map((f) => f.contents).join(separator),
    ...mergeFragmentImportsAndHoistedFragments(sortedFragments),
  };
}
