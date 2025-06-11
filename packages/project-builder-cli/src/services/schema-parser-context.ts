import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';

import { logger } from './logger.js';

/**
 * Creates a schema parser context for the given directory.
 * @param directory - The directory to create the schema parser context for.
 * @returns A promise that resolves to the schema parser context.
 */
export async function createSchemaParserContext(
  directory: string,
): Promise<SchemaParserContext> {
  // dynamically import to avoid loading the server package unnecessarily
  const { createNodeSchemaParserContext } = await import(
    '@baseplate-dev/project-builder-server/plugins'
  );
  const builtInPlugins = await getDefaultPlugins(logger);
  return createNodeSchemaParserContext(directory, logger, builtInPlugins);
}
