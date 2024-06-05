import {
  ProjectDefinitionContainer,
  BackendAppConfig,
  ProjectDefinition,
  AppEntry,
} from '@halfdomelabs/project-builder-lib';

import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';

export function buildDocker(
  projectDefinition: ProjectDefinition,
  app: BackendAppConfig,
): unknown {
  return {
    name: 'docker',
    generator: '@halfdomelabs/core/docker/docker-compose',
    postgres: getPostgresSettings(projectDefinition).config,
    ...(app.enableRedis
      ? { redis: getRedisSettings(projectDefinition).config }
      : {}),
  };
}

export function compileBackend(
  definitionContainer: ProjectDefinitionContainer,
  app: BackendAppConfig,
): AppEntry {
  const appBuilder = new AppEntryBuilder(definitionContainer, app);

  const { projectDefinition, parsedProject } = appBuilder;

  const packageName = projectDefinition.packageScope
    ? `@${projectDefinition.packageScope}/${app.name}`
    : `${projectDefinition.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Backend app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    hoistedProviders: parsedProject.globalHoistedProviders,
    children: {
      projects: [
        buildDocker(projectDefinition, app),
        buildFastify(appBuilder, app),
      ],
      // jest: {
      //   generator: '@halfdomelabs/core/node/jest',
      // },
      vitest: {
        generator: '@halfdomelabs/core/node/vitest',
      },
    },
  });
  return appBuilder.toProjectEntry();
}
