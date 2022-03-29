/**
 * Builds out the full path so it can be used for imports/writing to file
 * @param path Path to the file with file extension
 */
export function buildPath(path: string): {
  importPath: string;
  filePath: string;
} {
  const importPath = `@/${path.replace(/\.(ts|tsx)$/, '')}`;
  const filePath = path;
  return { importPath, filePath };
}
