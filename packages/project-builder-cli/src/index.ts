import { SchemaParserContext } from '@halfdomelabs/project-builder-lib';
import {
  buildProjectForDirectory,
  BuildProjectForDirectoryOptions,
  buildToCleanFolder,
  createNodeSchemaParserContext,
} from '@halfdomelabs/project-builder-server';
import { program } from 'commander';

import { addServeCommand } from './server.js';
import { getGeneratorSetupConfig } from './services/generator-modules.js';
import { logger } from './services/logger.js';
import { getBuiltInPlugins } from './services/plugins.js';
import { expandPathWithTilde } from './utils/path.js';
import { getPackageVersion } from './utils/version.js';

async function createSchemaParserContext(
  directory: string,
): Promise<SchemaParserContext> {
  const builtInPlugins = await getBuiltInPlugins();
  return createNodeSchemaParserContext(directory, logger, builtInPlugins);
}

async function runMain(): Promise<void> {
  const version = await getPackageVersion();

  if (!version) {
    throw new Error('Could not determine package version');
  }

  const generatorSetupConfig = await getGeneratorSetupConfig();

  program.version(version ?? 'unknown', '-v, --version');

  program
    .command('generate [directory]')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action(
      async (
        directory: string | undefined,
        { regen }: BuildProjectForDirectoryOptions,
      ) => {
        const resolvedDirectory = directory
          ? expandPathWithTilde(directory)
          : '.';
        const context = await createSchemaParserContext(resolvedDirectory);
        return buildProjectForDirectory({
          directory: resolvedDirectory,
          regen,
          logger,
          generatorSetupConfig,
          context,
        });
      },
    );

  program
    .command('buildClean [directory]')
    .description(
      'Writes a clean project from project.json in baseplate/ directory to sub-apps',
    )
    .action(async (directory: string) => {
      const resolvedDirectory = directory
        ? expandPathWithTilde(directory)
        : '.';
      const context = await createSchemaParserContext(resolvedDirectory);
      return buildToCleanFolder({
        directory,
        logger,
        generatorSetupConfig,
        context,
      });
    });

  addServeCommand(program, version);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => logger.error(err));
