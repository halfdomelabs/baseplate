// async function write backend

import { ParsedProjectConfig } from '@src/parser';
import { ProjectConfig, BackendConfig } from '../../schema';
import { AppEntry } from '../../types/files';
import { AppEntryBuilder } from '../projectEntryBuilder';
import { buildFastify } from './fastify';

export function buildDocker(projectConfig: ProjectConfig): unknown {
  return {
    name: 'docker',
    generator: '@baseplate/core/docker/docker-compose',
    postgres: {
      port: projectConfig.portBase + 432,
    },
  };
}

export function compileBackend(
  projectConfig: ProjectConfig,
  app: BackendConfig
): AppEntry {
  const appBuilder = new AppEntryBuilder(
    projectConfig,
    'backend',
    app.packageLocation || 'packages/backend'
  );

  const parsedProject = new ParsedProjectConfig(projectConfig);

  appBuilder.addDescriptor('root.json', {
    generator: '@baseplate/core/node/node',
    name: `${projectConfig.name}-backend`,
    description: `Backend for ${projectConfig.name}`,
    version: projectConfig.version,
    hoistedProviders: parsedProject.globalHoistedProviders,
    children: {
      projects: [buildDocker(projectConfig), buildFastify(appBuilder)],
    },
  });
  return appBuilder.toProjectEntry();
}
