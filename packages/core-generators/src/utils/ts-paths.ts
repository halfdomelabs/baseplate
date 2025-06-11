/**
 * Normalizes a TypeScript file path to a JavaScript file path useful
 * for converting source file paths to Node.js compatible paths.
 *
 * @param filePath - The file path to normalize with a *.ts or *.tsx extension.
 * @returns The normalized file path with a *.js extension.
 */
export function normalizeTsPathToJsPath(filePath: string): string {
  return filePath.replace(/\.(t|j)sx?$/, '.js');
}
