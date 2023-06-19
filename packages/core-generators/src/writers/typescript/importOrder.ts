// rough approximation based off import/order eslint rule
// https://github.com/import-js/eslint-plugin-import/blob/main/src/core/importType.js

// in the future, we could run eslint --fix with better caching

import { isAbsolute as nodeIsAbsolute } from 'path';
import isCoreModule from 'is-core-module';
import * as R from 'ramda';

const DEFAULT_SORT_ORDER = [
  'builtin',
  'external',
  'internal',
  'parent',
  'sibling',
  'index',
  'object',
  'type',
];

interface ImportSettings {
  internalRegex?: RegExp;
  coreModules?: string[];
}

const scopedRegExp = /^@[^/]+\/?[^/]+/;
export function isScoped(name: string): boolean {
  return !!name && scopedRegExp.test(name);
}

function baseModule(name: string): string {
  if (isScoped(name)) {
    const [scope, pkg] = name.split('/');
    return `${scope}/${pkg}`;
  }
  const [pkg] = name.split('/');
  return pkg;
}

function isInternalRegexMatch(name: string, settings: ImportSettings): boolean {
  const internalScope = settings?.internalRegex;
  return !!internalScope && new RegExp(internalScope).test(name);
}

export function isAbsolute(name: string): boolean {
  return typeof name === 'string' && nodeIsAbsolute(name);
}

// path is defined only when a resolver resolves to a non-standard path
export function isBuiltIn(name: string, settings: ImportSettings): boolean {
  if (!name) return false;
  const base = baseModule(name);
  const extras = settings?.coreModules || [];
  return isCoreModule(base) || extras.indexOf(base) > -1;
}

const moduleRegExp = /^\w/;
function isModule(name: string): boolean {
  return !!name && moduleRegExp.test(name);
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/;
export function isScopedMain(name: string): boolean {
  return !!name && scopedMainRegExp.test(name);
}

function isRelativeToParent(name: string): boolean {
  return /^\.\.$|^\.\.[\\/]/.test(name);
}

const indexFiles = ['.', './', './index', './index.js'];
function isIndex(name: string): boolean {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name: string): boolean {
  return /^\.[\\/]/.test(name);
}

function isExternalLookingName(name: string): boolean {
  return isModule(name) || isScoped(name);
}

function getImportType(name: string, settings: ImportSettings): string {
  if (isInternalRegexMatch(name, settings)) {
    return 'internal';
  }
  // TODO: Make more flexible
  if (name.startsWith('@src') || name.startsWith('src')) {
    return 'internal';
  }
  if (isAbsolute(name)) {
    return 'absolute';
  }
  if (isBuiltIn(name, settings)) {
    return 'builtin';
  }
  if (isRelativeToParent(name)) {
    return 'parent';
  }
  if (isIndex(name)) {
    return 'index';
  }
  if (isRelativeToSibling(name)) {
    return 'sibling';
  }
  if (isExternalLookingName(name)) {
    return 'external';
  }
  return 'unknown';
}

export function sortByImportOrder(
  names: string[],
  settings: ImportSettings
): string[] {
  const importTypeSort = R.ascend((name: string) =>
    DEFAULT_SORT_ORDER.indexOf(getImportType(name, settings))
  );
  const nameSort = R.ascend(R.toLower);
  return R.sortWith([importTypeSort, nameSort], names);
}
