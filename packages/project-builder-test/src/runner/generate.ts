import type { BuildProjectResult } from '@halfdomelabs/project-builder-server';

import { getDefaultPlugins } from '@halfdomelabs/project-builder-common';
import {
  buildProject,
  createNodeSchemaParserContext,
} from '@halfdomelabs/project-builder-server';

import { logger } from '@src/utils/console.js';

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
