import { toposortLocal } from '@baseplate-dev/utils';
import { isEqual, keyBy, uniqWith } from 'es-toolkit';

import type { TsImportDeclaration } from '../imports/types.js';
import type { TsCodeFragment, TsHoistedFragment } from './types.js';

/**
 * An object containing flattened imports and hoisted fragments.
 */
interface FlattenedHoistedFragmentsWithDependencies {
  /**
   * A list of hoisted fragments.
   */
  hoistedFragments: TsHoistedFragment[];
  /**
   * A list of imports.
   */
  imports: TsImportDeclaration[];
  /**
   * A list of edges of the nested hoisted fragment key to the parent hoisted fragment key
   */
  dependencies: [string, string][];
}

/**
 * Extracts the imports and hoisted fragments from a code fragment
 * pulling out hoisted fragments that are nested within the fragment
 * recursively.
 *
 * @param fragment - The code fragment to flatten
 * @param parentKey - The key of the parent hoisted fragment or undefined if the fragment is not nested
 * @returns An object containing flattened imports and hoisted fragments
 */
function extractFlattenedHoistedFragmentsWithDependencies(
  fragment: TsCodeFragment,
  parentKey?: string,
): FlattenedHoistedFragmentsWithDependencies {
  const hoistedFragments: TsHoistedFragment[] = [
    ...(fragment.hoistedFragments ?? []),
  ];
  const imports: TsImportDeclaration[] = [...(fragment.imports ?? [])];
  const dependencies: [string, string][] =
    parentKey && fragment.hoistedFragments
      ? fragment.hoistedFragments.map((d) => [d.key, parentKey])
      : [];

  for (const dependency of fragment.hoistedFragments ?? []) {
    const flattened = extractFlattenedHoistedFragmentsWithDependencies(
      dependency,
      dependency.key,
    );
    hoistedFragments.push(...flattened.hoistedFragments);
    imports.push(...flattened.imports);
    dependencies.push(...flattened.dependencies);
  }

  return {
    hoistedFragments,
    imports,
    dependencies,
  };
}

/**
 * An object containing flattened imports and hoisted fragments.
 */
export interface FlattenedImportsAndHoistedFragments {
  /**
   * A list of imports.
   */
  imports: TsImportDeclaration[];
  /**
   * A list of hoisted fragments ordered by lexical closeness/topological sort.
   */
  hoistedFragments: TsHoistedFragment[];
}

function mergeFlattenedHoistedFragmentsWithDependencies(
  flattenedImportsAndHoistedFragments: FlattenedHoistedFragmentsWithDependencies[],
): FlattenedHoistedFragmentsWithDependencies {
  const imports: TsImportDeclaration[] = [];
  const hoistedFragments: TsHoistedFragment[] = [];
  const dependencies: [string, string][] = [];

  for (const flattened of flattenedImportsAndHoistedFragments) {
    imports.push(...flattened.imports);
    hoistedFragments.push(...flattened.hoistedFragments);
    dependencies.push(...flattened.dependencies);
  }

  return { imports, hoistedFragments, dependencies };
}

function sortKeyedFragments(
  keyedFragments: TsHoistedFragment[],
  dependencies: [string, string][],
  compareFunc?: (a: string, b: string) => number,
): TsHoistedFragment[] {
  const uniqueKeyedFragments = uniqWith(keyedFragments, (a, b) => {
    if (a.key === b.key) {
      if (!isEqual(a, b)) {
        throw new Error(
          `Duplicate hoisted fragment key ${a.key} with different contents`,
        );
      }
      return true;
    }
    return false;
  });

  const fragmentsByKey = keyBy(uniqueKeyedFragments, (f) => f.key);
  const sortedFragmentKeys = toposortLocal(
    uniqueKeyedFragments.map((f) => f.key),
    dependencies,
    { compareFunc },
  );

  return sortedFragmentKeys.map((key) => fragmentsByKey[key]);
}

/**
 * Flattens imports and hoisted fragments from a collection of code fragments.
 *
 * @param fragments - The code fragments to process
 * @returns An object containing flattened imports and processed hoisted fragments
 */
export function flattenImportsAndHoistedFragments(
  fragments: TsCodeFragment[],
): FlattenedImportsAndHoistedFragments {
  const flattenResults = fragments.map((f) =>
    extractFlattenedHoistedFragmentsWithDependencies(f),
  );

  const { imports, hoistedFragments, dependencies } =
    mergeFlattenedHoistedFragmentsWithDependencies(flattenResults);

  const sortedHoistedFragments = sortKeyedFragments(
    hoistedFragments,
    dependencies,
  );

  return {
    imports,
    hoistedFragments: sortedHoistedFragments,
  };
}

/**
 * Merges a list of code fragments with hoisted fragments colocated near their usage points
 * rather than hoisted to the top of the file.
 *
 * This places associated fragments (like type definitions) adjacent to the code fragments
 * that use them, which improves code organization in dynamically generated files like
 * service files with multiple service functions and hoisted fragments.
 *
 * @param fragments - The list of code fragments to merge
 * @param separator - The separator to use between fragments
 * @param options - The options for the merge
 * @param options.preserveOrder - Whether to preserve the order of the fragments otherwise they will be sorted alphabetically by name
 * @returns A new code fragment with the merged imports and hoisted fragments ordered by lexical closeness/topological sort
 */
export function mergeFragmentsWithHoistedFragments(
  rootFragments: Map<string, TsCodeFragment> | Record<string, TsCodeFragment>,
  separator = '\n\n',
): TsCodeFragment {
  const rootFragmentMap =
    rootFragments instanceof Map
      ? rootFragments
      : new Map(Object.entries(rootFragments));
  const rootFragmentsArray = [...rootFragmentMap].map(([key, fragment]) => ({
    ...fragment,
    key,
  }));
  const flattenedResults = rootFragmentsArray.map((fragment) =>
    extractFlattenedHoistedFragmentsWithDependencies(fragment, fragment.key),
  );
  const { imports, hoistedFragments, dependencies } =
    mergeFlattenedHoistedFragmentsWithDependencies(flattenedResults);

  const rootFragmentKeys = new Set(rootFragmentsArray.map((f) => f.key));
  const fragments = [...hoistedFragments, ...rootFragmentsArray];

  const sortedHoistedFragments = sortKeyedFragments(
    fragments,
    dependencies,
    (a, b) => {
      const isARoot = rootFragmentKeys.has(a);
      const isBRoot = rootFragmentKeys.has(b);
      // if it's a root fragment, we want to place it before any other dependencies
      // at the same topological level so that these dependencies will remain adjacent
      // to the root fragment that uses them
      if (isARoot && !isBRoot) return -1;
      if (!isARoot && isBRoot) return 1;
      return a.localeCompare(b);
    },
  );

  return {
    contents: sortedHoistedFragments.map((f) => f.contents).join(separator),
    imports,
  };
}

/**
 * Merges a list of code fragments with hoisted fragments colocated near their usage points
 * rather than hoisted to the top of the file maintaining the original order of the fragments.
 *
 * This places associated fragments (like type definitions) adjacent to the code fragments
 * that use them, which improves code organization in dynamically generated files like
 * service files with multiple service functions and hoisted fragments.
 *
 * @param rootFragments - The list of code fragments to merge
 * @param separator - The separator to use between fragments
 * @returns A new code fragment with the merged imports and hoisted fragments ordered by lexical closeness/topological sort
 */
export function mergeFragmentsWithHoistedFragmentsPresorted(
  rootFragments: TsCodeFragment[],
  separator = '\n\n',
): TsCodeFragment {
  const paddedDigits = Math.ceil(Math.log10(rootFragments.length + 1));
  return mergeFragmentsWithHoistedFragments(
    new Map(
      rootFragments.map(
        (f, idx) =>
          [
            `root-fragment-${String(idx).padStart(paddedDigits, '0')}`,
            f,
          ] as const,
      ),
    ),
    separator,
  );
}
