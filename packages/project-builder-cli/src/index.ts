import { program } from 'commander';

import {
  buildProjectForDirectory,
  BuildProjectForDirectoryOptions,
  buildToCleanFolder,
} from './runner/index.js';
import { startWebServer } from './server/index.js';
import { logger } from './services/logger.js';
import { getPackageVersion } from './utils/version.js';

async function runMain(): Promise<void> {
  const version = await getPackageVersion();
  program.version(version || 'unknown');
  program
    .command('generate <directory>')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action((directory: string, options: BuildProjectForDirectoryOptions) =>
      buildProjectForDirectory(directory, options),
    );

  program
    .command('buildClean <directory>')
    .description(
      'Writes a clean project from project.json in baseplate/ directory to sub-apps',
    )
    .action(buildToCleanFolder);
  program
    .command('serve')
    .description('Starts the project builder web service')
    .option(
      '--browser',
      'Opens browser with project builder web service',
      !process.env.NO_BROWSER || process.env.NO_BROWSER === 'false',
    )
    .option('--no-browser', 'Do not start browser')
    .option(
      '--port <number>',
      'Port to listen on',
      parseInt,
      process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    )
    .argument(
      '[directories...]',
      'Directories to serve',
      process.env.PROJECT_DIRECTORIES?.split(',') || ['.'],
    )
    .action(startWebServer);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => logger.error(err));
