import { startWebServer } from '@halfdomelabs/project-builder-server';
import { Command } from 'commander';
import path from 'node:path';
import { packageDirectory } from 'pkg-dir';

import { getEnabledFeatureFlags } from './services/feature-flags.js';
import { getGeneratorSetupConfig } from './services/generator-modules.js';
import { logger } from './services/logger.js';
import { getBuiltInPlugins } from './services/plugins.js';
import { expandPathWithTilde } from './utils/path.js';
import { resolveModule } from './utils/resolve.js';

interface ServeCommandOptions {
  browser: boolean;
  port: number;
}

export function addServeCommand(program: Command, version: string): void {
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
      process.env.PROJECT_DIRECTORIES?.split(',') ?? ['.'],
    )
    .action(
      async (directories: string[], { browser, port }: ServeCommandOptions) => {
        const projectBuilderWebDir = await packageDirectory({
          cwd: resolveModule('@halfdomelabs/project-builder-web/package.json'),
        });
        const generatorSetupConfig = await getGeneratorSetupConfig();
        const resolvedDirectories = directories.map((dir) =>
          expandPathWithTilde(dir),
        );
        const builtInPlugins = await getBuiltInPlugins();

        if (!projectBuilderWebDir) {
          throw new Error(
            `Unable to find project-builder-web package to host website`,
          );
        }

        return startWebServer({
          directories: resolvedDirectories,
          browser,
          port,
          cliVersion: version,
          projectBuilderStaticDir: path.join(projectBuilderWebDir, 'dist'),
          logger,
          generatorSetupConfig,
          builtInPlugins,
          featureFlags: getEnabledFeatureFlags(),
        });
      },
    );
}
