import {
  ProjectDefinitionContainer,
  BackendAppConfig,
  ProjectConfig,
  AppEntry,
} from '@halfdomelabs/project-builder-lib';

import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';

export function buildDocker(
  projectConfig: ProjectConfig,
  app: BackendAppConfig,
): unknown {
  return {
    name: 'docker',
    generator: '@halfdomelabs/core/docker/docker-compose',
    postgres: getPostgresSettings(projectConfig).config,
    ...(app.enableRedis
      ? { redis: getRedisSettings(projectConfig).config }
      : {}),
  };
}

export function compileBackend(
  definitionContainer: ProjectDefinitionContainer,
  app: BackendAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(definitionContainer, app);

  const { projectConfig, parsedProject } = appBuilder;

  const packageName = projectConfig.packageScope
    ? `@${projectConfig.packageScope}/${app.name}`
    : `${projectConfig.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectConfig.name}-${app.name}`,
    packageName,
    description: `Backend app for ${projectConfig.name}`,
    version: projectConfig.version,
    hoistedProviders: parsedProject.globalHoistedProviders,
    children: {
      projects: [
        buildDocker(projectConfig, app),
        buildFastify(appBuilder, app),
      ],
      jest: {
        generator: '@halfdomelabs/core/node/jest',
      },
    },
  });
  return appBuilder.toProjectEntry();
}
