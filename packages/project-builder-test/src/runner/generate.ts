import type { SyncProjectResult } from '@baseplate-dev/project-builder-server';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import {
  createNodeSchemaParserContext,
  syncProject,
} from '@baseplate-dev/project-builder-server';

import { logger } from '#src/utils/console.js';

export async function generateProject(
  projectDirectory: string,
): Promise<SyncProjectResult> {
  const defaultPlugins = await getDefaultPlugins(logger);
  const nodeSchemaParserContext = await createNodeSchemaParserContext(
    {
      id: 'test-project',
      name: 'Test Project',
      directory: projectDirectory,
      isInternalExample: true,
    },
    logger,
    defaultPlugins,
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
