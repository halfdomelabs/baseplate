/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

/**
 * Simple wrapper for require.resolve for easier unit testing
 */
export function resolveModule(module: string): string {
  return require.resolve(module);
}

/**
 * Simple function to load a module dynamically
 *
 * @param module Name of module to load
 */
export function getModuleDefault<T>(module: string): T {
  return require(module)?.default as T;
}
