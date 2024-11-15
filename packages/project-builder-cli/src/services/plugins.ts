import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';

import { discoverPlugins } from '@halfdomelabs/project-builder-server';
import { fileURLToPath } from 'node:url';

import { logger } from './logger.js';

export function getBuiltInPlugins(): Promise<PluginMetadataWithPaths[]> {
  return discoverPlugins(fileURLToPath(import.meta.url), logger);
}
