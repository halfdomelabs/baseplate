import type { BuildProjectResult } from '@baseplate-dev/project-builder-server';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import {
  buildProject,
  createNodeSchemaParserContext,
} from '@baseplate-dev/project-builder-server';

import { logger } from '#src/utils/console.js';

export async function generateProject(
  projectDirectory: string,
): Promise<BuildProjectResult> {
  const defaultPlugins = await getDefaultPlugins(logger);
  const nodeSchemaParserContext = await createNodeSchemaParserContext(
    projectDirectory,
    logger,
    defaultPlugins,
  );
  return buildProject({
    directory: projectDirectory,
    logger,
    context: nodeSchemaParserContext,
    userConfig: {},
  });
}
