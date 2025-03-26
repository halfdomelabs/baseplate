import { isBuiltin as isBuiltinModule } from 'node:module';

import type { TsImportDeclaration } from '../types.js';

// Adapted from https://perfectionist.dev/rules/sort-imports.html

const IMPORT_SORT_GROUPS = [
  'builtin',
  'external',
  'internal',
  'parent',
  'sibling',
  'side-effect',
  'side-effect-style',
  'type',
  'index',
  'style',
  'external-type',
  'builtin-type',
  'internal-type',
  'parent-type',
  'sibling-type',
  'index-type',
  'unknown',
] as const;

/**
 * Represents the various import sorting groups
 */
export type ImportSortGroup = (typeof IMPORT_SORT_GROUPS)[number];
/**
 * Options for classifying imports
 */
export interface GetImportSortGroupOptions {
  /**
   * Patterns that identify internal modules
   */
  internalPatterns?: RegExp[];
  /**
   * File extensions that are considered style imports
   *
   * @default ['.less', '.scss', '.sass', '.styl', '.pcss', '.css', '.sss']
   */
  styleExtensions?: string[];
  /**
   * The sort groups that are allowed to be set. Unknown will always be present.
   */
  allowedSortGroups: readonly ImportSortGroup[];
}

const DEFAULT_OPTIONS: GetImportSortGroupOptions = {
  internalPatterns: [],
  styleExtensions: [
    '.less',
    '.scss',
    '.sass',
    '.styl',
    '.pcss',
    '.css',
    '.sss',
  ],
  allowedSortGroups: IMPORT_SORT_GROUPS,
};

/**
 * Determines if a module is an index import
 */
function isIndexImport(moduleName: string): boolean {
  return [
    './index.d.js',
    './index.d.ts',
    './index.js',
    './index.ts',
    './index.cjs',
    './index.cts',
    './index.mjs',
    './index.mts',
    './index',
    './',
    '.',
  ].includes(moduleName);
}

/**
 * Determines if a module is a parent directory import
 */
function isParentImport(moduleName: string): boolean {
  return moduleName.startsWith('..');
}

/**
 * Determines if a module is a sibling import
 */
function isSiblingImport(moduleName: string): boolean {
  return moduleName.startsWith('./') && !isIndexImport(moduleName);
}

/**
 * Determines if an import path matches any of the internal patterns
 */
function isInternalImport(
  moduleName: string,
  internalPatterns: RegExp[] = [],
): boolean {
  return internalPatterns.some((pattern) => pattern.test(moduleName));
}

/**
 * Determines if a module is an external import (not relative or internal)
 */
function isExternalImport(
  moduleName: string,
  internalPatterns: RegExp[] = [],
): boolean {
  return (
    !moduleName.startsWith('.') &&
    !moduleName.startsWith('/') &&
    !isInternalImport(moduleName, internalPatterns) &&
    !isBuiltinModule(moduleName)
  );
}

/**
 * Determines if an import is a style import based on its file extension
 */
function isStyleImport(
  moduleName: string,
  styleExtensions: string[] = [],
): boolean {
  // Handle query parameters
  const [cleanedValue] = moduleName.split('?');
  return styleExtensions.some((extension) => cleanedValue.endsWith(extension));
}

/**
 * Determines if an import is a side effect import (no specifiers)
 */
function isSideEffectImport(importDecl: TsImportDeclaration): boolean {
  return (
    !importDecl.defaultImport &&
    !importDecl.namespaceImport &&
    (!importDecl.namedImports || importDecl.namedImports.length === 0)
  );
}

/**
 * Classifies an import into its appropriate sorting group
 */
export function getImportSortGroup(
  importDecl: TsImportDeclaration,
  options: Partial<GetImportSortGroupOptions> = {},
): ImportSortGroup {
  const { source, isTypeOnly } = importDecl;
  const { internalPatterns, styleExtensions, allowedSortGroups } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  let sortGroup: ImportSortGroup | undefined;

  // Set the sort group if it hasn't been set yet
  const setGroup = (group: ImportSortGroup): void => {
    if (!allowedSortGroups.includes(group)) return;
    sortGroup = sortGroup ?? group;
  };

  // Check for type-only imports
  if (isTypeOnly) {
    if (isBuiltinModule(source)) {
      setGroup('builtin-type');
    }
    if (isExternalImport(source, internalPatterns)) {
      setGroup('external-type');
    }
    if (isInternalImport(source, internalPatterns)) {
      setGroup('internal-type');
    }
    if (isParentImport(source)) {
      setGroup('parent-type');
    }
    if (isSiblingImport(source)) {
      setGroup('sibling-type');
    }
    if (isIndexImport(source)) {
      setGroup('index-type');
    }
    setGroup('type');
  }

  // Check for side effect imports
  const isSideEffect = isSideEffectImport(importDecl);
  if (isSideEffect) {
    // Check if it's a side effect style import
    if (isStyleImport(source, styleExtensions)) {
      setGroup('side-effect-style');
    }
    setGroup('side-effect');
  }

  // Check for style imports (even if they have named imports)
  if (isStyleImport(source, styleExtensions)) {
    setGroup('style');
  }

  // Regular imports
  if (isIndexImport(source)) {
    setGroup('index');
  }
  if (isSiblingImport(source)) {
    setGroup('sibling');
  }
  if (isParentImport(source)) {
    setGroup('parent');
  }
  if (isBuiltinModule(source)) {
    setGroup('builtin');
  }
  if (isExternalImport(source, internalPatterns)) {
    setGroup('external');
  }
  if (isInternalImport(source, internalPatterns)) {
    setGroup('internal');
  }

  // Default fallback
  return sortGroup ?? 'unknown';
}
