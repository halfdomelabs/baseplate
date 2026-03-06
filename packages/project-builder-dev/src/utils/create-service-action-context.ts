import type {
  PluginMetadataWithPaths,
  ProjectInfo,
} from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';

import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';
import { getUserConfig } from '@baseplate-dev/project-builder-server/user-config';
import { getPackageVersion } from '@baseplate-dev/utils/node';

import { logger } from '#src/services/logger.js';

import { loadDevConfig } from './dev-config.js';
import { listProjects } from './list-projects.js';

export async function createServiceActionContext(
  project?: ProjectInfo,
): Promise<ServiceActionContext> {
  const devConfig = await loadDevConfig();
  const projects = project ? [project] : await listProjects({});

  // Discover plugins from cwd, then each configured plugin root directory
  const allPluginArrays = await Promise.all([
    discoverPlugins(process.cwd(), logger),
    ...devConfig.pluginRootDirectories.map(async (dir) => {
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
    sessionId: 'default',
  };
}
