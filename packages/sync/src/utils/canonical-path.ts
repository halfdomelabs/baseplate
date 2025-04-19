/**
 * The canonical path is the project relativepath to a file that can be used as both an import
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
