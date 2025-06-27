import type { BuilderServiceManager } from '@baseplate-dev/project-builder-server';
import type { Command } from 'commander';
import type { FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import path from 'node:path';
import { packageDirectory } from 'pkg-dir';

import { getUserConfig } from '#src/services/user-config.js';

import { getEnabledFeatureFlags } from '../services/feature-flags.js';
import { logger } from '../services/logger.js';
import { expandPathWithTilde } from '../utils/path.js';
import { resolveModule } from '../utils/resolve.js';
import { getPackageVersion } from '../utils/version.js';

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
  const resolvedDirectories = directories.map((dir) =>
    expandPathWithTilde(dir),
  );
  const builtInPlugins = await getDefaultPlugins(logger);
  const version = await getPackageVersion();

  if (!projectBuilderWebDir) {
    throw new Error(
      `Unable to find project-builder-web package to host website`,
    );
  }

  const userConfig = await getUserConfig();

  const serviceManager = new BuilderServiceManager({
    initialDirectories: resolvedDirectories,
    cliVersion: version,
    builtInPlugins,
    userConfig,
    skipCommands,
    cliFilePath: process.argv[1],
  });

  const fastifyInstance = await startWebServer({
    serviceManager,
    browser,
    port: port ?? DEFAULT_SERVER_PORT,
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
      '[directories...]',
      'Directories to serve',
      process.env.PROJECT_DIRECTORIES?.split(',') ?? ['.'],
    )
    .action(
      async (directories: string[], { browser, port }: ServeCommandOptions) => {
        await serveWebServer(directories, { browser, port });
      },
    );
}
