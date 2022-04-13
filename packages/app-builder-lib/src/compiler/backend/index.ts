// async function write backend

import { ParsedAppConfig } from '@src/parser';
import { AppConfig, BackendConfig } from '../../schema';
import { ProjectEntry } from '../../types/files';
import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildFastify } from './fastify';

export function buildDocker(appConfig: AppConfig): unknown {
  return {
    name: 'docker',
    generator: '@baseplate/core/docker/docker-compose',
    postgres: {
      port: appConfig.portBase + 432,
    },
  };
}

export function compileBackend(
  appConfig: AppConfig,
  app: BackendConfig
): ProjectEntry {
  const projectBuilder = new ProjectEntryBuilder(
    appConfig,
    'backend',
    app.packageLocation || 'packages/backend'
  );

  const parsedApp = new ParsedAppConfig(appConfig);

  projectBuilder.addDescriptor('project.json', {
    generator: '@baseplate/core/node/node',
    name: `${appConfig.name}-backend`,
    description: `Backend for ${appConfig.name}`,
    version: appConfig.version,
    hoistedProviders: parsedApp.globalHoistedProviders,
    children: {
      projects: [buildDocker(appConfig), buildFastify(projectBuilder)],
    },
  });
  return projectBuilder.toProjectEntry();
}
