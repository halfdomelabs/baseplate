import type { ts } from 'ts-morph';

import { minBy } from 'es-toolkit';
import pathPosix from 'node:path/posix';

import type { TsPathMapEntry } from './types.js';

/**
 * Strips the relative prefix from a project relative path
 * @param path
 * @returns
 */
function stripRelativePrefixFromProjectRelativePath(path: string): string {
  if (path.startsWith('./')) {
    return path.slice(2);
  }
  if (path.startsWith('../')) {
    throw new Error(
      `Expected project relative path, but got relative path ${path}`,
    );
  }
  return path;
}

/**
 * Attempts to resolve the aliased path from a project relative path
 *
 * @param projectPath The project relative path to resolve from
 * @param TsPathMapEntry The path map entry to use
 * @returns The aliased path if the path map matches, otherwise undefined
 */
function getAliasedPathFromTsPathMapEntry(
  projectPath: string,
  entry: TsPathMapEntry,
): string | undefined {
  const strippedProjectPath =
    stripRelativePrefixFromProjectRelativePath(projectPath);
  const strippedToPath = stripRelativePrefixFromProjectRelativePath(entry.to);
  const fromPath = entry.from;

  // return the from, if it's an exact match
  if (strippedProjectPath === strippedToPath) return fromPath;
  if (strippedToPath.includes('*')) {
    // validate from and to path
    if (!strippedToPath.endsWith('/*')) {
      throw new Error(
        `Path map entry 'to' path (${entry.to}) must end with /* for wildcard support`,
      );
    }
    const isFromPathWildcard = fromPath.includes('*');
    if (isFromPathWildcard && !fromPath.endsWith('/*')) {
      throw new Error(
        `Path map entry 'from' path (${fromPath}) must end with /* for wildcard support`,
      );
    }
    const toPathPrefix = strippedToPath.slice(0, -1);
    if (!strippedProjectPath.startsWith(toPathPrefix)) return undefined;
    return isFromPathWildcard
      ? fromPath.slice(0, -1) + strippedProjectPath.slice(toPathPrefix.length)
      : fromPath;
  }
  return undefined;
}

/**
 * Checks if an import is an internal import
 *
 * @param name - The name of the import
 * @param pathmapEntries - The path map entries
 * @returns `true` if the import is internal, `false` otherwise
 */
function isInternalImport(
  name: string,
  pathmapEntries: TsPathMapEntry[],
): boolean {
  return (
    name.startsWith('.') ||
    pathmapEntries.some(
      (entry) => !!getAliasedPathFromTsPathMapEntry(name, entry),
    )
  );
}

type ModuleResolutionKind = `${ts.server.protocol.ModuleResolutionKind}`;

/**
 * Options for resolving module paths
 */
interface ResolveModuleOptions {
  /**
   * The path map entries
   */
  pathMapEntries?: TsPathMapEntry[];
  /**
   * The module resolution kind
   */
  moduleResolution: ModuleResolutionKind;
}

const TS_FILE_EXTENSION_REGEX = /\.[tj]sx?$/;

/**
 * Normalizes the path for the given module resolution kind
 *
 * Specifically, for Node16, it will ensure the path has a .js extension
 * and for other module resolution kinds, it will remove the .js extension
 * and the /index suffix
 *
 * @param path - The path to normalize
 * @param moduleResolution - The module resolution kind
 * @returns The normalized path
 */
function normalizePathForResolutionKind(
  path: string,
  { moduleResolution, pathMapEntries }: ResolveModuleOptions,
): string {
  const isNode16 =
    moduleResolution === 'node16' || moduleResolution === 'nodenext';
  if (
    isNode16 &&
    isInternalImport(path, pathMapEntries ?? []) &&
    !TS_FILE_EXTENSION_REGEX.test(path)
  ) {
    throw new Error(
      `Invalid Node 16 import discovered ${path}. Make sure to use .js extension for Node16 imports.`,
    );
  }

  return isNode16
    ? // normalize the extension to .js
      path.replace(TS_FILE_EXTENSION_REGEX, '.js')
    : path.replace(/(\/index)?\.js$/, '');
}

/**
 * Normalizes the module specifier to pick the best import path based on the following rules:
 *
 * 1) If the import is an external module (e.g. axios), keep the module specifier as-is.
 * 2) Otherwise if the module is a relative module (./) or absolute internal path (@/),
 *    identify the shortest way to refer to the module (either relative path or using
 *    a path alias) and use that as the module specifier.
 *
 * @param moduleSpecifier The module specifier to resolve
 * @param directory The directory we need to resolve the module specifier from
 * @param options Options for resolving the modules
 * @returns The normalized module specifier
 */
export function normalizeModuleSpecifier(
  moduleSpecifier: string,
  directory: string,
  options: ResolveModuleOptions,
): string {
  const { pathMapEntries } = options;
  // if not an internal import, just return directly
  if (!moduleSpecifier.startsWith('@/') && !moduleSpecifier.startsWith('.')) {
    return moduleSpecifier;
  }
  // figure out the shortest way to resolve the module
  const projectRelativePath = moduleSpecifier.startsWith('@/')
    ? moduleSpecifier.slice(2)
    : pathPosix.join(directory, moduleSpecifier);

  const relativePath = pathPosix.relative(directory, projectRelativePath);
  const relativePathImport = relativePath.startsWith('.')
    ? relativePath
    : `./${relativePath}`;

  const typescriptPathImports =
    pathMapEntries
      ?.map((entry) =>
        getAliasedPathFromTsPathMapEntry(projectRelativePath, entry),
      )
      .filter((x) => x !== undefined) ?? [];

  return normalizePathForResolutionKind(
    minBy([relativePathImport, ...typescriptPathImports], (x) => x.length),
    options,
  );
}
