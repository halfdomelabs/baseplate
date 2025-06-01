import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';

import { IS_PREVIEW } from '../config.js';
import { trpc } from '../trpc.js';
import { createProjectNotFoundHandler } from './errors.js';

/**
 * Gets the metadata for the plugins available for a given project.
 *
 * @param projectId - The ID of the project to get the plugins metadata for.
 * @returns The plugins metadata.
 */
export async function getPluginsMetadata(
  projectId: string,
): Promise<PluginMetadataWithPaths[]> {
  if (IS_PREVIEW) {
    return [];
  }
  return trpc.plugins.getAvailablePlugins
    .mutate({ projectId })
    .catch(createProjectNotFoundHandler(projectId));
}
