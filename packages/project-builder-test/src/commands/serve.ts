import type { ProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';
import type { ServiceActionContext } from '@baseplate-dev/project-builder-server/actions';
import type { Command } from 'commander';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import { getLatestMigrationVersion } from '@baseplate-dev/project-builder-lib';
import {
  BuilderServiceManager,
  DEFAULT_SERVER_PORT,
  startWebServer,
} from '@baseplate-dev/project-builder-server';
import { loadProjectFromDirectory } from '@baseplate-dev/project-builder-server/actions';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pino } from 'pino';
import { packageDirectory } from 'pkg-dir';

import { logger } from '#src/utils/console.js';
import { getTestProjectsDirectory } from '#src/utils/directories.js';
import { resolveModule } from '#src/utils/resolve.js';
import { getCliVersion } from '#src/utils/version.js';

async function createTestProject(
  projectName: string,
  projectDirectory: string,
): Promise<void> {
  // create the project
  await fs.mkdir(path.join(projectDirectory, 'baseplate'), { recursive: true });
  await fs.writeFile(
    path.join(projectDirectory, 'package.json'),
    JSON.stringify(
      {
        name: `@baseplate-dev/test-${projectName}`,
        version: '0.1.0',
        private: true,
        description: 'A Baseplate test project',
        license: 'UNLICENSED',
        author: 'Half Dome Labs LLC',
        scripts: {
          preinstall: 'npx only-allow pnpm',
        },
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(projectDirectory, 'baseplate/project-definition.json'),
    JSON.stringify({
      settings: {
        general: {
          name: projectName,
          portOffset: 3000,
        },
      },
      isInitialized: true,
      features: [],
      models: [],
      schemaVersion: getLatestMigrationVersion(),
    } satisfies ProjectDefinitionInput),
  );
}

async function serveWebsite(projectDirectory: string): Promise<void> {
  const projectBuilderWebDir = await packageDirectory({
    cwd: resolveModule('@baseplate-dev/project-builder-web/package.json'),
  });
  const builtInPlugins = await getDefaultPlugins(logger);

  if (!projectBuilderWebDir) {
    throw new Error(
      `Unable to find project-builder-web package to host website`,
    );
  }

  const cliVersion = await getCliVersion();

  const pinoLogger = pino({
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  });

  const projectInfo = await loadProjectFromDirectory(projectDirectory);

  const context: ServiceActionContext = {
    projects: [projectInfo],
    plugins: builtInPlugins,
    logger: pinoLogger,
    userConfig: {},
    cliVersion,
  };

  const serviceManager = new BuilderServiceManager({
    serviceActionContext: context,
    cliVersion,
  });

  await startWebServer({
    serviceManager,
    browser: false,
    port: DEFAULT_SERVER_PORT,
    cliVersion,
    projectBuilderStaticDir: path.join(projectBuilderWebDir, 'dist'),
    logger: pinoLogger,
    featureFlags: [],
    userConfig: {},
  });
}

async function serveTestProject(projectName: string): Promise<void> {
  const testProjectsDirectory = await getTestProjectsDirectory();
  const projectDirectory = path.join(testProjectsDirectory, projectName);

  // check if folder exists. If not, generate it
  try {
    await fs.access(projectDirectory);
  } catch {
    logger.log(`Project ${projectName} does not exist. Generating it...`);
    await createTestProject(projectName, projectDirectory);
  }

  // serve the project
  await serveWebsite(projectDirectory);
}

export function addCliServeCommand(program: Command): void {
  program
    .command('serve')
    .argument('<project-name>', 'Serve ')
    .description(
      'Serves the Baseplate UI for a particular project, generating it if necessary',
    )
    .action(serveTestProject);
}
