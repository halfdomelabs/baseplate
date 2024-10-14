/**
 * Builds out the full path so it can be used for imports/writing to file
 * @param path Path to the file with file extension
 */
export function makeImportAndFilePath(path: string): [string, string] {
  const importPath = `@/${path.replace(/\.(ts|tsx)$/, '.js')}`;
  return [importPath, path];
}
