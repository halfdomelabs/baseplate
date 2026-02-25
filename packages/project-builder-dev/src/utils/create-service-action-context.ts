import type {
  PluginMetadataWithPaths,
  ProjectInfo,
} from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';

import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';
import { getUserConfig } from '@baseplate-dev/project-builder-server/user-config';
import {
  expandPathWithTilde,
  getPackageVersion,
} from '@baseplate-dev/utils/node';

import { logger } from '#src/services/logger.js';

import { getEnvConfig } from './config.js';
import { listProjects } from './list-projects.js';

export async function createServiceActionContext(
  project?: ProjectInfo,
): Promise<ServiceActionContext> {
  const config = getEnvConfig();
  const projects = project ? [project] : await listProjects({});

  const extraPluginDirs =
    config.PLUGIN_ROOT_DIRECTORIES?.split(',')
      .map((d) => expandPathWithTilde(d.trim()))
      .filter(Boolean) ?? [];

  // Discover plugins from cwd, then each extra root directory
  const allPluginArrays = await Promise.all([
    discoverPlugins(process.cwd(), logger),
    ...extraPluginDirs.map(async (dir) => {
      try {
        return await discoverPlugins(dir, logger);
      } catch {
        logger.warn(`Could not discover plugins from ${dir}`);
        return [] as PluginMetadataWithPaths[];
      }
    }),
  ]);

  // Deduplicate by fullyQualifiedName (cwd takes precedence)
  const pluginMap = new Map<string, PluginMetadataWithPaths>();
  for (const plugins of allPluginArrays) {
    for (const plugin of plugins) {
      if (!pluginMap.has(plugin.fullyQualifiedName)) {
        pluginMap.set(plugin.fullyQualifiedName, plugin);
      }
    }
  }
  const plugins = [...pluginMap.values()];

  const userConfig = await getUserConfig();
  const cliVersion = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  return {
    projects,
    logger,
    userConfig,
    plugins,
    cliVersion,
  };
}
