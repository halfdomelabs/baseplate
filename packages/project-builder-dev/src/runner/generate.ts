import type { SyncProjectResult } from '@baseplate-dev/project-builder-server';

import {
  createNodeSchemaParserContext,
  syncProject,
} from '@baseplate-dev/project-builder-server';
import { loadProjectFromDirectory } from '@baseplate-dev/project-builder-server/actions';
import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';

import { logger } from '#src/services/logger.js';

/**
 * Generates (syncs) a Baseplate project from its project-definition.json.
 * Plugins are auto-discovered from the project directory's package.json.
 *
 * @param projectDirectory - Absolute path to the project directory
 * @returns The sync result
 */
export async function generateProject(
  projectDirectory: string,
): Promise<SyncProjectResult> {
  const plugins = await discoverPlugins(projectDirectory, logger);
  const projectInfo = await loadProjectFromDirectory(projectDirectory);
  const nodeSchemaParserContext = await createNodeSchemaParserContext(
    projectInfo,
    logger,
    plugins,
    '0.1.0',
  );
  try {
    return await syncProject({
      directory: projectDirectory,
      logger,
      context: nodeSchemaParserContext,
      userConfig: {},
    });
  } catch (error) {
    logger.error('Project sync failed:', error);
    throw error;
  }
}
