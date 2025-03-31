import { isEqual, orderBy, uniqWith } from 'es-toolkit';

import type { TsImportDeclaration } from '../imports/types.js';
import type { TsCodeFragment, TsHoistedFragment } from './types.js';

interface HoistedFragmentWithPriority extends TsHoistedFragment {
  priority: number;
}

interface FlattenedImportsAndHoistedFragmentsWithPriority {
  imports: TsImportDeclaration[];
  hoistedFragments: HoistedFragmentWithPriority[];
}

function flattenImportsAndHoistedFragmentsRecursive(
  fragments: TsCodeFragment[],
  priority = 0,
): FlattenedImportsAndHoistedFragmentsWithPriority {
  const imports: TsImportDeclaration[] = [];
  const hoistedFragments: HoistedFragmentWithPriority[] = [];

  for (const fragment of fragments) {
    // Add imports and hoisted fragments from the current fragment
    imports.push(...(fragment.imports ?? []));
    hoistedFragments.push(
      ...(fragment.hoistedFragments?.map((f) => ({
        ...f,
        priority,
      })) ?? []),
    );

    // Add imports and hoisted fragments from nested fragments
    const hoistedExtractionResult = flattenImportsAndHoistedFragmentsRecursive(
      fragment.hoistedFragments?.map((f) => f.fragment) ?? [],
      priority + 1,
    );
    imports.push(...hoistedExtractionResult.imports);
    hoistedFragments.push(...hoistedExtractionResult.hoistedFragments);
  }

  return {
    imports,
    hoistedFragments,
  };
}

export interface FlattenedImportsAndHoistedFragments {
  imports: TsImportDeclaration[];
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
  const flattenedFragments =
    flattenImportsAndHoistedFragmentsRecursive(fragments);
  return {
    imports: flattenedFragments.imports,
    /**
     * Process hoisted fragments:
     * 1. Sort by priority (highest to lowest) and then by key
     * 2. Deduplicate by key, keeping only the highest priority version
     * Example: [a(p:2), b(p:1), c(p:0), a(p:0)] becomes [a(p:2), b(p:1), c(p:0)]
     */
    hoistedFragments: uniqWith(
      orderBy(
        flattenedFragments.hoistedFragments,
        ['priority', 'key'],
        ['desc', 'asc'],
      ),
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
    ),
  };
}
