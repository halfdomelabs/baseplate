import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the default plugins
 *
 * @param {import('@baseplate-dev/sync').Logger} logger - Logger instance for logging.
 */
export async function getDefaultPlugins(logger) {
  // dynamically import to avoid loading the server package unnecessarily
  const { discoverPlugins } =
    await import('@baseplate-dev/project-builder-server/plugins');
  return discoverPlugins(path.dirname(fileURLToPath(import.meta.url)), logger);
}
