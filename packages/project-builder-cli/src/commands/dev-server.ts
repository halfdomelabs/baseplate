import type { Command } from 'commander';

import path from 'node:path';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

import { logger } from '../services/logger.js';

export function addDevServerCommand(program: Command): void {
  program
    .command('dev-server')
    .description('Start the development server with MCP integration')
    .option(
      '-c, --current-dir <path>',
      'Current directory (default: process.cwd())',
    )
    .action(async (options: { currentDir: string }) => {
      const cwd = options.currentDir
        ? path.resolve(options.currentDir)
        : process.cwd();

      logger.info('Starting Baseplate development server...', {
        cwd,
      });

      const context = await createServiceActionContext();

      const { DevServer } = await import(
        '@baseplate-dev/project-builder-server/dev-server'
      );

      const devServer = new DevServer({
        cwd,
        context,
      });

      await devServer.start();
    });
}
