import {
  getDefaultGeneratorSetupConfig,
  getDefaultPlugins,
} from '@halfdomelabs/project-builder-common';
import {
  buildProjectForDirectory,
  createNodeSchemaParserContext,
} from '@halfdomelabs/project-builder-server';

import { logger } from '@src/utils/console.js';

export async function generateProject(projectDirectory: string): Promise<void> {
  const generatorSetupConfig = await getDefaultGeneratorSetupConfig(logger);
  const defaultPlugins = await getDefaultPlugins(logger);
  const nodeSchemaParserContext = await createNodeSchemaParserContext(
    projectDirectory,
    logger,
    defaultPlugins,
  );
  return buildProjectForDirectory({
    directory: projectDirectory,
    logger,
    generatorSetupConfig,
    context: nodeSchemaParserContext,
  });
}
