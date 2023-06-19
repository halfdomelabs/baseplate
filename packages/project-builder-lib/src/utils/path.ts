/**
 * Computes the relative path from one path to another.
 */
export function computeRelativePath(fromPath: string, toPath: string): string {
  const fromSegments = fromPath.split('/');
  const toSegments = toPath.split('/');

  // Remove the common segments from the beginning
  while (
    fromSegments.length > 0 &&
    toSegments.length > 0 &&
    fromSegments[0] === toSegments[0]
  ) {
    fromSegments.shift();
    toSegments.shift();
  }

  // Add the necessary number of '../' to go up the directory hierarchy
  const numParentDirs = fromSegments.length;
  const parentDirs = Array<string>(numParentDirs).fill('..');

  // Construct the relative path
  const relativePath = [...parentDirs, ...toSegments].join('/');

  return relativePath;
}
