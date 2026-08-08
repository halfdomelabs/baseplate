import type { SyncProjectResult } from '@baseplate-dev/project-builder-server';

import {
  createNodeSchemaParserContext,
  syncProject,
} from '@baseplate-dev/project-builder-server';
import { loadProjectFromDirectory } from '@baseplate-dev/project-builder-server/actions';
import { discoverPlugins } from '@baseplate-dev/project-builder-server/plugins';
import path from 'node:path';

import { logger } from '#src/services/logger.js';

/**
 * Generates (syncs) a Baseplate project from its project-definition.json.
 * Plugins are auto-discovered from the project directory's package.json.
 *
 * @remarks Reached via the `./runner` export rather than the package root: it
 * loads the sync engine and the generator packages, which would otherwise land
 * on the startup path of every `baseplate-dev` command.
 *
 * @param projectDirectory - Absolute path to the project directory
 * @returns The sync result
 */
export async function generateProject(
  projectDirectory: string,
): Promise<SyncProjectResult> {
  const plugins = await discoverPlugins(projectDirectory, logger);
  const projectInfo = await loadProjectFromDirectory(
    projectDirectory,
    path.join(projectDirectory, 'baseplate'),
    'user',
  );
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
    logger.error(error, 'Project sync failed');
    throw error;
  }
}
