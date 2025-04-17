import path from 'node:path';

/**
 * Builds out the full path so it can be used for imports/writing to file
 * @param path Path to the file with file extension
 */
export function makeImportAndFilePath(...filePath: string[]): [string, string] {
  const mergedFilePath = filePath.join('/').replace(/@\//, '');
  const importPath = `@/${mergedFilePath
    .replace(/\.(ts|tsx)$/, '.js')
    // normalize path separators for Windows to POSIX for imports
    .replaceAll(path.sep, path.posix.sep)}`;
  return [importPath, mergedFilePath];
}
