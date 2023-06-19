import path from 'path';

/**
 * Simple function to load a module dynamically
 *
 * @param module Name of module to load
 */
export async function getModuleDefault<T>(module: string): Promise<T | null> {
  const importedModule = (await import(path.join(module, 'index.js'))) as {
    default: T;
  };
  return importedModule?.default;
}
