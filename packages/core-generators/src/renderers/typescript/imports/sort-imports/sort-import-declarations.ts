import { mapGroupBy } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';

import type { TsImportDeclaration } from '../types.js';
import type { ImportSortGroup } from './get-import-sort-group.js';

import { getImportSortGroup } from './get-import-sort-group.js';

/**
 * Configuration options for sorting import declarations
 */
export interface SortImportDeclarationsOptions {
  /**
   * Groups to sort imports by. Each inner array represents imports
   * that should be grouped together.
   */
  groups: readonly (ImportSortGroup | readonly ImportSortGroup[])[];
  /**
   * Whether to ignore case when sorting imports
   *
   * @default true
   */
  ignoreCase: boolean;
  /**
   * Patterns that identify internal modules
   */
  internalPatterns: RegExp[];
}

/**
 * Default options for sorting import declarations
 */
const defaultSortOptions: SortImportDeclarationsOptions = {
  groups: [
    'type',
    ['builtin', 'external'],
    'internal-type',
    'internal',
    ['parent-type', 'sibling-type', 'index-type'],
    ['parent', 'sibling', 'index'],
    ['side-effect', 'side-effect-style'],
    'unknown',
  ],
  ignoreCase: true,
  internalPatterns: [],
};

/**
 * Sorts import declarations according to the specified group order,
 * preserving the order of side-effect imports.
 *
 * @param importDeclarations - Array of import declarations to sort
 * @param options - Configuration options for sorting
 * @returns Array of arrays, where each inner array contains imports of the same group
 */
export function sortImportDeclarations(
  importDeclarations: TsImportDeclaration[],
  options: Partial<SortImportDeclarationsOptions> = {},
): TsImportDeclaration[][] {
  // Merge with default options
  const {
    internalPatterns,
    groups,
    ignoreCase,
  }: SortImportDeclarationsOptions = {
    ...defaultSortOptions,
    ...options,
  };

  const allowedSortGroups = groups.flatMap((group) =>
    typeof group === 'string' ? [group] : group,
  );

  const declarationsWithMetadata = importDeclarations.map(
    (importDeclaration) => {
      const sortGroup = getImportSortGroup(importDeclaration, {
        internalPatterns,
        allowedSortGroups,
      });
      return {
        importDeclaration,
        sortGroup,
        isSideEffect:
          sortGroup === 'side-effect' || sortGroup === 'side-effect-style',
      };
    },
  );

  const groupedDeclarations = mapGroupBy(
    declarationsWithMetadata,
    (declarationWithMetadata) => {
      const { sortGroup } = declarationWithMetadata;
      return groups.findIndex((group) =>
        typeof group === 'string'
          ? group === sortGroup
          : group.includes(sortGroup),
      );
    },
  );

  // Create result buckets for each group
  const declarationGroups = [
    ...groups.map((_, idx) => groupedDeclarations.get(idx) ?? []),
    groupedDeclarations.get(-1) ?? [],
  ].filter((group) => group.length > 0);

  return declarationGroups.map((group) => {
    // Sort non-side-effect imports by source and side-effect imports are left as-is
    const nonSideEffectImports = group.filter(
      (declarationWithMetadata) => !declarationWithMetadata.isSideEffect,
    );
    const sideEffectImports = group.filter(
      (declarationWithMetadata) => declarationWithMetadata.isSideEffect,
    );
    return [
      ...sortBy(nonSideEffectImports, [
        (declarationWithMetadata) =>
          ignoreCase
            ? declarationWithMetadata.importDeclaration.source.toLowerCase()
            : declarationWithMetadata.importDeclaration.source,
      ]),
      ...sideEffectImports,
    ].map(
      (declarationWithMetadata) => declarationWithMetadata.importDeclaration,
    );
  });
}
