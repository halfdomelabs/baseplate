import { toposortLocal } from '@halfdomelabs/utils';
import { isEqual, keyBy, uniqWith } from 'es-toolkit';

import type { TsImportDeclaration } from '../imports/types.js';
import type { TsCodeFragment, TsHoistedFragment } from './types.js';

interface FlattenedImportsAndHoistedFragmentsWithDependencies {
  imports: TsImportDeclaration[];
  hoistedFragments: TsHoistedFragment[];
  // A list of edges in the dependency graph
  dependencies: [string, string][];
}

/**
 * Flattens a hoisted fragment and all of its dependencies.
 *
 * @param hoistedFragment - The hoisted fragment to flatten
 * @returns An object containing flattened imports, hoisted fragments, and dependencies
 */
function flattenHoistedFragment({
  fragment,
  key,
}: TsHoistedFragment): FlattenedImportsAndHoistedFragmentsWithDependencies {
  const imports: TsImportDeclaration[] = fragment.imports ?? [];
  const hoistedFragments: TsHoistedFragment[] = fragment.hoistedFragments ?? [];
  const dependencies: [string, string][] =
    fragment.hoistedFragments?.map((f) => [f.key, key]) ?? [];

  for (const childHoistedFragment of fragment.hoistedFragments ?? []) {
    const childExtractionResult = flattenHoistedFragment(childHoistedFragment);
    imports.push(...childExtractionResult.imports);
    hoistedFragments.push(...childExtractionResult.hoistedFragments);
    dependencies.push(...childExtractionResult.dependencies);
  }

  return {
    imports,
    hoistedFragments,
    dependencies,
  };
}

/**
 * Extracts the imports and hoisted fragments from a code fragment.
 *
 * @param fragment - The code fragment to extract imports and hoisted fragments from
 * @returns An object containing flattened imports and hoisted fragments
 */
function extractFlattenedImportsAndHoistedFragmentsFromFragment(
  fragment: TsCodeFragment,
): FlattenedImportsAndHoistedFragmentsWithDependencies {
  const imports: TsImportDeclaration[] = fragment.imports ?? [];
  const hoistedFragments: TsHoistedFragment[] = fragment.hoistedFragments ?? [];
  const dependencies: [string, string][] = [];

  for (const hoistedFragment of hoistedFragments) {
    // Add imports and hoisted fragments from nested fragments
    const hoistedExtractionResult = flattenHoistedFragment(hoistedFragment);
    imports.push(...hoistedExtractionResult.imports);
    hoistedFragments.push(...hoistedExtractionResult.hoistedFragments);
    dependencies.push(...hoistedExtractionResult.dependencies);
  }

  return {
    imports,
    hoistedFragments,
    dependencies,
  };
}

/**
 * Extracts the imports and hoisted fragments from a collection of code fragments.
 *
 * @param fragments - The code fragments to extract imports and hoisted fragments from
 * @returns An object containing flattened imports and hoisted fragments
 */
function extractFlattenedImportsAndHoistedFragmentsFromFragments(
  fragments: TsCodeFragment[],
): FlattenedImportsAndHoistedFragmentsWithDependencies {
  const imports: TsImportDeclaration[] = [];
  const hoistedFragments: TsHoistedFragment[] = [];
  const dependencies: [string, string][] = [];

  for (const fragment of fragments) {
    const flattenedFragment =
      extractFlattenedImportsAndHoistedFragmentsFromFragment(fragment);
    imports.push(...flattenedFragment.imports);
    hoistedFragments.push(...flattenedFragment.hoistedFragments);
    dependencies.push(...flattenedFragment.dependencies);
  }

  return {
    imports,
    hoistedFragments,
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

/**
 * Flattens imports and hoisted fragments from a collection of code fragments.
 *
 * @param fragments - The code fragments to process
 * @returns An object containing flattened imports and processed hoisted fragments
 */
export function flattenImportsAndHoistedFragments(
  fragments: TsCodeFragment[],
): FlattenedImportsAndHoistedFragments {
  const flattenResult =
    extractFlattenedImportsAndHoistedFragmentsFromFragments(fragments);
  const uniqueHoistedFragments = uniqWith(
    flattenResult.hoistedFragments,
    (a, b) => {
      if (a.key === b.key) {
        if (!isEqual(a.fragment, b.fragment)) {
          throw new Error(
            `Duplicate hoisted fragment key ${a.key} with different contents`,
          );
        }
        return true;
      }
      return false;
    },
  );

  const hoistedFragmentsByKey = keyBy(uniqueHoistedFragments, (f) => f.key);
  const sortedHoistedFragmentKeys = toposortLocal(
    uniqueHoistedFragments.map((f) => f.key),
    flattenResult.dependencies,
  );
  return {
    imports: flattenResult.imports,
    /**
     * Process hoisted fragments by lexical closeness/topological sort.
     */
    hoistedFragments: sortedHoistedFragmentKeys.map(
      (key) => hoistedFragmentsByKey[key],
    ),
  };
}
