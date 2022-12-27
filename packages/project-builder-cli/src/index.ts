import { program } from 'commander';
import {
  buildProjectForDirectory,
  BuildProjectForDirectoryOptions,
  buildToCleanFolder,
} from './runner';
import { startWebServer } from './server';
import { logger } from './services/logger';

async function runMain(): Promise<void> {
  program.version('0.0.1');
  program
    .command('generate <directory>')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action((directory: string, options: BuildProjectForDirectoryOptions) =>
      buildProjectForDirectory(directory, options)
    );

  program
    .command('buildClean <directory>')
    .description(
      'Writes a clean project from project.json in baseplate/ directory to sub-apps'
    )
    .action(buildToCleanFolder);

  program
    .command('serve')
    .description('Starts the project builder web service')
    .option('--no-browser', 'Do not start browser')
    .option('--port <number>', 'Port to listen on', parseInt)
    .argument(
      '[directories...]',
      'Directories to serve',
      process.env.PROJECT_DIRECTORIES?.split(',') || ['.']
    )
    .action(startWebServer);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => logger.error(err));
