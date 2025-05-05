import path from 'node:path';

/**
 * Join paths using POSIX path separators. Use this function to join paths
 * inside generators where we always want to use POSIX path separators.
 *
 * @param paths - The paths to join
 * @returns The joined path
 */
export function posixJoin(...paths: string[]): string {
  return path.posix.join(...paths);
}
