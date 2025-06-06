import path from 'node:path';

/**
 * Normalizes path separators from Windows (\) to Unix (/) format.
 * @param filePath The path to normalize
 * @returns The path with Unix separators
 */
export function normalizePathSeparators(filePath: string): string {
  return filePath.replaceAll(path.win32.sep, path.posix.sep);
}
