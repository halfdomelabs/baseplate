import path from 'node:path/posix';

/**
 * Returns the highest common ancestor path from a list of absolute paths.
 *
 * Only works for POSIX-style paths.
 *
 * @param paths - Array of absolute paths
 * @returns Common ancestor path
 */
export function getCommonPathPrefix(paths: string[]): string {
  const first = paths.at(0);
  if (first === undefined) return '';
  const rest = paths.slice(1);
  if (rest.length === 0) return path.dirname(first);

  const firstParts = path.dirname(first).split(path.sep);
  let commonParts = [...firstParts];

  for (const current of rest) {
    const currentParts = current.split(path.sep);
    const pathLength = Math.min(firstParts.length, currentParts.length);
    let i = 0;

    while (i < pathLength && commonParts[i] === currentParts[i]) {
      i++;
    }
    commonParts = commonParts.slice(0, i);
    if (commonParts.length === 0) break;
  }

  return commonParts.length > 0 &&
    !(commonParts.length === 1 && commonParts[0] === '')
    ? commonParts.join(path.sep)
    : path.parse(first).root;
}
