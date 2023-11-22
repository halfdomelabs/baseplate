import {
  buildProjectForDirectory,
  BuildProjectForDirectoryOptions,
  buildToCleanFolder,
} from '@halfdomelabs/project-builder-server';
import { program } from 'commander';

import { addServeCommand } from './server.js';
import { getGeneratorSetupConfig } from './services/generator-modules.js';
import { logger } from './services/logger.js';
import { getPackageVersion } from './utils/version.js';

async function runMain(): Promise<void> {
  const version = await getPackageVersion();

  if (!version) {
    throw new Error('Could not determine package version');
  }

  const generatorSetupConfig = await getGeneratorSetupConfig();

  program.version(version ?? 'unknown');
  program
    .command('generate <directory>')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action((directory: string, { regen }: BuildProjectForDirectoryOptions) =>
      buildProjectForDirectory({
        directory,
        regen,
        logger,
        generatorSetupConfig,
      }),
    );

  program
    .command('buildClean <directory>')
    .description(
      'Writes a clean project from project.json in baseplate/ directory to sub-apps',
    )
    .action((directory: string) =>
      buildToCleanFolder({
        directory,
        logger,
        generatorSetupConfig,
      }),
    );

  addServeCommand(program, version);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => logger.error(err));
