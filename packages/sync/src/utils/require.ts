import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Simple function to load a module dynamically
 *
 * @param module Name of module to load
 */
export async function getModuleDefault<T>(module: string): Promise<T | null> {
  const fileUrl = module.startsWith('file://')
    ? module
    : pathToFileURL(module).href;
  const importedModule = (await import(path.join(fileUrl, 'index.js'))) as {
    default: T;
  };
  return importedModule.default;
}
