import { normalizePathSeparators, posixJoin } from '@baseplate-dev/utils/node';

/**
 * The canonical path is the output relative path to a file that can be used as both an import
 * or file destination. It is of the form '@/src/path/file.ts'.
 */
export function isCanonicalPath(path: string): boolean {
  return path.startsWith('@/');
}

/**
 * Normalizes a path to a project path.
 * @param path The path to normalize
 * @returns The normalized path
 */
export function normalizePathToProjectPath(path: string): string {
  if (isCanonicalPath(path)) {
    return path.slice(2);
  }
  return path;
}

/**
 * Converts a output relative path to a canonical path.
 * @param path The path to convert
 * @returns The canonical path
 */
export function toCanonicalPath(path: string): string {
  if (isCanonicalPath(path)) {
    return path;
  }
  const normalizedPath = normalizePathSeparators(path);
  if (normalizedPath.startsWith('/') || normalizedPath.startsWith('..')) {
    throw new Error(
      `Expected an output relative path, but got an absolute path or relative path with a parent directory: ${normalizedPath}`,
    );
  }
  return posixJoin('@', normalizedPath);
}
