import { discoverPlugins } from '@baseplate-dev/project-builder-server';
import { fileURLToPath } from 'node:url';

export function getDefaultPlugins(logger) {
  return discoverPlugins(fileURLToPath(import.meta.url), logger);
}
