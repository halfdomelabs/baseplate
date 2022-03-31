// async function write backend

import { AppConfig } from '../../schema';
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

export function compileBackend(appConfig: AppConfig): ProjectEntry {
  const projectBuilder = new ProjectEntryBuilder(
    appConfig,
    'backend',
    'packages/backend'
  );

  projectBuilder.addDescriptor('project.json', {
    generator: '@baseplate/core/node/node',
    name: `${appConfig.name}-backend`,
    description: `Backend for ${appConfig.name}`,
    version: appConfig.version,
    ...(appConfig.auth?.passwordProvider
      ? { hoistedProviders: ['password-hasher-service'] }
      : {}),
    children: {
      projects: [buildDocker(appConfig), buildFastify(projectBuilder)],
    },
  });
  return projectBuilder.toProjectEntry();
}
