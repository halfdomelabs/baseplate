import type {
  AppEntry,
  BackendAppConfig,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';

import { backendAppEntryType } from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

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
  const appBuilder = new AppEntryBuilder(
    definitionContainer,
    app,
    backendAppEntryType,
  );

  const { projectDefinition, parsedProject, appCompiler } = appBuilder;

  const packageName = projectDefinition.packageScope
    ? `@${projectDefinition.packageScope}/${app.name}`
    : `${projectDefinition.name}-${app.name}`;

  appBuilder.addDescriptor('root.json', {
    generator: '@halfdomelabs/core/node/node',
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Backend app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    hoistedProviders: [
      ...parsedProject.globalHoistedProviders,
      ...appCompiler.getGlobalHoistedProviders(),
    ],
    children: {
      projects: [
        buildDocker(projectDefinition, app),
        buildFastify(appBuilder, app),
      ],
      vitest: {
        generator: '@halfdomelabs/core/node/vitest',
      },
    },
  });
  return appBuilder.toProjectEntry();
}
