import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';

import { getDefaultPlugins } from '@halfdomelabs/project-builder-common';
import {
  buildProjectForDirectory,
  createNodeSchemaParserContext,
} from '@halfdomelabs/project-builder-server';
import { program } from 'commander';

import { addServeCommand } from './server.js';
import { logger } from './services/logger.js';
import { expandPathWithTilde } from './utils/path.js';
import { getPackageVersion } from './utils/version.js';

async function createSchemaParserContext(
  directory: string,
): Promise<SchemaParserContext> {
  const builtInPlugins = await getDefaultPlugins(logger);
  return createNodeSchemaParserContext(directory, logger, builtInPlugins);
}

async function runMain(): Promise<void> {
  const version = await getPackageVersion();

  if (!version) {
    throw new Error('Could not determine package version');
  }

  program.version(version, '-v, --version');

  program
    .command('generate [directory]')
    .description(
      'Builds project from project-definition.json in baseplate/ directory',
    )
    .action(async (directory: string | undefined) => {
      const resolvedDirectory = directory
        ? expandPathWithTilde(directory)
        : '.';
      const context = await createSchemaParserContext(resolvedDirectory);
      return buildProjectForDirectory({
        directory: resolvedDirectory,
        logger,
        context,
      });
    });

  addServeCommand(program, version);

  await program.parseAsync(process.argv);
}

try {
  await runMain();
} catch (err) {
  logger.error(err);
}
