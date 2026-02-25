import type { BuilderServiceManager } from '@baseplate-dev/project-builder-server';
import type { Command } from 'commander';
import type { Logger } from 'pino';

import { getUserConfig } from '@baseplate-dev/project-builder-server/user-config';
import { getPackageVersion } from '@baseplate-dev/utils/node';
import path from 'node:path';
import { packageDirectory } from 'pkg-dir';

import { logger } from '#src/services/logger.js';
import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { listProjects } from '#src/utils/list-projects.js';
import { resolveModule } from '#src/utils/resolve.js';

interface ServeCommandOptions {
  browser: boolean;
  port?: number;
  logger?: Logger;
  skipCommands?: boolean;
}

async function serveWebServer({
  browser,
  port,
  logger: overrideLogger,
  skipCommands,
}: ServeCommandOptions): Promise<{
  serviceManager: BuilderServiceManager;
}> {
  const { BuilderServiceManager, DEFAULT_SERVER_PORT, startWebServer } =
    await import('@baseplate-dev/project-builder-server');

  const projectBuilderWebDir = await packageDirectory({
    cwd: resolveModule('@baseplate-dev/project-builder-web/package.json'),
  });
  const version = (await getPackageVersion(import.meta.dirname)) ?? '0.0.0';

  if (!projectBuilderWebDir) {
    throw new Error(
      `Unable to find project-builder-web package to host website`,
    );
  }

  const userConfig = await getUserConfig();
  const context = await createServiceActionContext();

  const serviceManager = new BuilderServiceManager({
    cliVersion: version,
    skipCommands,
    cliFilePath: process.argv[1],
    serviceActionContext: context,
  });

  // Apply PORT_OFFSET if set
  const portOffset = process.env.PORT_OFFSET
    ? Number.parseInt(process.env.PORT_OFFSET, 10)
    : 0;
  const effectivePort = port ?? DEFAULT_SERVER_PORT + portOffset;

  await startWebServer({
    serviceManager,
    browser,
    port: effectivePort,
    cliVersion: version,
    projectBuilderStaticDir: path.join(projectBuilderWebDir, 'dist'),
    logger: overrideLogger ?? logger,
    featureFlags: [],
    userConfig,
  });

  return { serviceManager };
}

export function addServeCommand(program: Command): void {
  program
    .command('serve')
    .description(
      'Starts the project builder web service for discovered projects (respects EXCLUDE_EXAMPLES and EXAMPLES_DIRECTORIES)',
    )
    .option(
      '--browser',
      'Opens browser with project builder web service',
      !process.env.NO_BROWSER || process.env.NO_BROWSER === 'false',
    )
    .option('--no-browser', 'Do not open browser')
    .option(
      '--port <number>',
      'Port to listen on',
      Number.parseInt,
      process.env.PORT ? Number.parseInt(process.env.PORT, 10) : undefined,
    )
    .action(async ({ browser, port }: ServeCommandOptions) => {
      try {
        const projects = await listProjects({});
        const projectNames = projects.map((p) => p.name);

        if (projectNames.length > 0) {
          logger.info(
            `Serving ${projectNames.length} project(s): ${projectNames.join(', ')}`,
          );
        }

        await serveWebServer({ browser, port });
      } catch (error) {
        logger.error(
          `Failed to start server: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    });
}
