import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Simple function to load the default export of a module dynamically
 *
 * @param modulePath - Path to the module to load
 * @returns The default export of the module
 */
export async function loadDefaultExport(modulePath: string): Promise<unknown> {
  const fileUrl = modulePath.startsWith('file://')
    ? modulePath
    : pathToFileURL(modulePath).href;
  const fullUrl =
    path.extname(fileUrl) === '.js' ? fileUrl : `${fileUrl}/index.js`;
  const importedModule = (await import(fullUrl)) as
    | { default?: unknown }
    | undefined;
  if (!importedModule?.default) {
    return undefined;
  }
  return importedModule.default;
}
