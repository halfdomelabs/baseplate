import { compareStrings } from '@baseplate-dev/utils';
import { isDeepStrictEqual } from 'node:util';

import type {
  TsCodeFragment,
  TsHoistedFragment,
  TsImportDeclaration,
} from '../renderers/typescript/index.js';

/**
 * Options for fragment comparison
 */
export interface CompareFragmentsOptions {
  /**
   * Whether to compare hoisted fragments (default: true)
   */
  compareHoistedFragments?: boolean;
}

/**
 * Normalizes imports for comparison by sorting them in a deterministic order
 * This allows order-independent comparison of imports
 *
 * @param imports - Array of import declarations to normalize
 * @returns Normalized array of import declarations
 */
export function normalizeImports(
  imports: TsImportDeclaration[],
): TsImportDeclaration[] {
  return imports
    .map((imp) => ({
      ...imp,
      // Sort named imports alphabetically
      namedImports: imp.namedImports?.toSorted((a, b) => {
        const nameCompare = compareStrings(a.name, b.name);
        if (nameCompare !== 0) return nameCompare;
        // If names are equal, sort by alias
        return compareStrings(a.alias ?? '', b.alias ?? '');
      }),
    }))
    .toSorted((a, b) => {
      // Primary sort: module specifier
      const moduleCompare = compareStrings(
        a.moduleSpecifier,
        b.moduleSpecifier,
      );
      if (moduleCompare !== 0) return moduleCompare;

      // Secondary sort: import type (namespace > default > named)
      const getImportTypeOrder = (imp: TsImportDeclaration): number => {
        if (imp.namespaceImport) return 1;
        if (imp.defaultImport) return 2;
        if (imp.namedImports) return 3;
        return 4;
      };

      const typeOrderA = getImportTypeOrder(a);
      const typeOrderB = getImportTypeOrder(b);
      if (typeOrderA !== typeOrderB) return typeOrderA - typeOrderB;

      // Tertiary sort: isTypeOnly (type-only imports first)
      if (a.isTypeOnly && !b.isTypeOnly) return -1;
      if (!a.isTypeOnly && b.isTypeOnly) return 1;

      return 0;
    });
}

/**
 * Normalizes hoisted fragments for comparison by sorting them by key
 *
 * @param fragments - Array of hoisted fragments to normalize
 * @returns Normalized array of hoisted fragments
 */
export function normalizeHoistedFragments(
  fragments?: TsHoistedFragment[],
): TsHoistedFragment[] | undefined {
  if (!fragments || fragments.length === 0) return undefined;

  return [...fragments]
    .map((frag) => {
      const normalized = normalizeFragment(frag);
      // Preserve the key property from the original hoisted fragment
      return {
        ...normalized,
        key: frag.key,
      } as TsHoistedFragment;
    })
    .toSorted((a, b) => compareStrings(a.key, b.key));
}

/**
 * Normalizes a code fragment for comparison
 * This includes trimming contents, sorting imports, and normalizing hoisted fragments
 *
 * @param fragment - The fragment to normalize
 * @param options - Options for normalization
 * @returns Normalized fragment
 */
export function normalizeFragment(
  fragment: TsCodeFragment,
  options?: CompareFragmentsOptions,
): TsCodeFragment {
  const normalized: TsCodeFragment = {
    contents: fragment.contents.trim(),
  };

  // Only include imports if they exist
  if (fragment.imports && fragment.imports.length > 0) {
    normalized.imports = normalizeImports(fragment.imports);
  }

  // Only include hoisted fragments if they exist and should be compared
  if (options?.compareHoistedFragments !== false && fragment.hoistedFragments) {
    const normalizedHoisted = normalizeHoistedFragments(
      fragment.hoistedFragments,
    );
    if (normalizedHoisted) {
      normalized.hoistedFragments = normalizedHoisted;
    }
  }

  return normalized;
}

/**
 * Compares two TsCodeFragment objects for equality, ignoring import order
 * This is useful for programmatic checks outside of test assertions
 *
 * @param actual - The actual fragment
 * @param expected - The expected fragment
 * @param options - Comparison options
 * @returns True if fragments are equal
 *
 * @example
 * ```typescript
 * const actual = tsCodeFragment('foo()', ...);
 * const expected = tsCodeFragment('foo()', ...);
 *
 * if (areFragmentsEqual(actual, expected)) {
 *   console.log('Fragments match!');
 * }
 * ```
 */
export function areFragmentsEqual(
  actual: TsCodeFragment,
  expected: TsCodeFragment,
  options?: CompareFragmentsOptions,
): boolean {
  const normalizedActual = normalizeFragment(actual, options);
  const normalizedExpected = normalizeFragment(expected, options);

  return isDeepStrictEqual(normalizedActual, normalizedExpected);
}
