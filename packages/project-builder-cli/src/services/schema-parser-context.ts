import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import { createNodeSchemaParserContext } from '@baseplate-dev/project-builder-server';

import { logger } from './logger.js';

/**
 * Creates a schema parser context for the given directory.
 * @param directory - The directory to create the schema parser context for.
 * @returns A promise that resolves to the schema parser context.
 */
export async function createSchemaParserContext(
  directory: string,
): Promise<SchemaParserContext> {
  const builtInPlugins = await getDefaultPlugins(logger);
  return createNodeSchemaParserContext(directory, logger, builtInPlugins);
}
