import type {
  PluginMetadataWithPaths,
  ProjectInfo,
} from '@baseplate-dev/project-builder-lib';
import type {
  PluginDiscoveryError,
  ServiceActionContext,
} from '@baseplate-dev/project-builder-server/actions';

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

  // Discover plugins from cwd, then each configured plugin root directory.
  // A failure in any single directory is non-fatal so the server still starts
  // with whatever plugins could be loaded; the errors are surfaced to clients
  // via context.pluginDiscoveryErrors.
  const pluginDiscoveryErrors: PluginDiscoveryError[] = [];
  const discoverPluginsSafely = async (
    dir: string,
  ): Promise<PluginMetadataWithPaths[]> => {
    try {
      return await discoverPlugins(dir, logger);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn(`Could not discover plugins from ${dir}: ${reason}`);
      pluginDiscoveryErrors.push({ directory: dir, reason });
      return [];
    }
  };

  const allPluginArrays = await Promise.all([
    discoverPluginsSafely(process.cwd()),
    ...devConfig.pluginRootDirectories.map((dir) => discoverPluginsSafely(dir)),
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
    pluginDiscoveryErrors,
    cliVersion,
    sessionId: 'default',
  };
}
