#!/usr/bin/env node --experimental-strip-types

import chalk from 'chalk';
import { program } from 'commander';

import type { GenerateOptions } from './commands/generate.js';
import type { SyncOptions } from './commands/sync.js';

import { checkCommand } from './commands/check.js';
import { generateCommand } from './commands/generate.js';
import { syncCommand } from './commands/sync.js';

program
  .name('metadata')
  .description('Manage metafiles across Baseplate monorepo packages')
  .version('1.0.0');

program
  .command('check')
  .description('Check all packages for correct metafiles')
  .action(async () => {
    try {
      await checkCommand();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('Synchronize metafiles across all packages')
  .option('-d, --dry-run', 'Show what would be changed without making changes')
  .option('-v, --verbose', 'Show detailed diff for all changes')
  .action(async (options: SyncOptions) => {
    try {
      await syncCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate a new package with prompts')
  .option('-p, --plugin', 'Generate a plugin package')
  .option('-l, --library', 'Generate a library package')
  .action(async (options) => {
    try {
      await generateCommand(options as GenerateOptions);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
