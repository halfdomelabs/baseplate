import type { BuilderServiceManager } from '@baseplate-dev/project-builder-server';
import type { Command } from 'commander';
import type { FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

import { discoverProjects } from '@baseplate-dev/project-builder-server/actions';
import { getUserConfig } from '@baseplate-dev/project-builder-server/user-config';
import {
  expandPathWithTilde,
  getPackageVersion,
} from '@baseplate-dev/utils/node';
import path from 'node:path';
import { packageDirectory } from 'pkg-dir';

import { getEnabledFeatureFlags } from '../services/feature-flags.js';
import { logger } from '../services/logger.js';
import { createServiceActionContext } from '../utils/create-service-action-context.js';
import { resolveModule } from '../utils/resolve.js';

interface ServeCommandOptions {
  browser: boolean;
  port?: number;
  logger?: Logger;
  skipCommands?: boolean;
}

export async function serveWebServer(
  directories: string[],
  { browser, port, logger: overrideLogger, skipCommands }: ServeCommandOptions,
): Promise<{
  fastifyInstance: FastifyInstance;
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

  const fastifyInstance = await startWebServer({
    serviceManager,
    browser,
    port: effectivePort,
    cliVersion: version,
    projectBuilderStaticDir: path.join(projectBuilderWebDir, 'dist'),
    logger: overrideLogger ?? logger,
    featureFlags: getEnabledFeatureFlags(),
    userConfig,
  });

  return {
    fastifyInstance,
    serviceManager,
  };
}

export function addServeCommand(program: Command): void {
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
      Number.parseInt,
      process.env.PORT ? Number.parseInt(process.env.PORT, 10) : undefined,
    )
    .argument(
      '[projects...]',
      'Project names or directories to serve',
      process.env.PROJECT_DIRECTORIES?.split(',') ?? ['.'],
    )
    .action(
      async (projects: string[], { browser, port }: ServeCommandOptions) => {
        try {
          // Resolve directories and discover projects
          const resolvedDirectories =
            projects.length > 0
              ? projects.map((dir) => expandPathWithTilde(dir))
              : [process.cwd()];

          const discoveredProjects = await discoverProjects(
            resolvedDirectories,
            logger,
          );
          const projectDirectories = discoveredProjects.map((p) => p.directory);
          const projectNames = discoveredProjects.map((p) => p.name);

          if (projectNames.length > 0) {
            logger.info(
              `Serving ${projectNames.length} project(s): ${projectNames.join(', ')}`,
            );
          }

          await serveWebServer(projectDirectories, { browser, port });
        } catch (error) {
          logger.error(
            `Failed to resolve projects: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      },
    );
}
