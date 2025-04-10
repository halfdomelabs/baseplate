import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';

import { getDefaultPlugins } from '@halfdomelabs/project-builder-common';
import { createNodeSchemaParserContext } from '@halfdomelabs/project-builder-server';

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
