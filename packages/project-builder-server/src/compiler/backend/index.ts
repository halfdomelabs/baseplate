import type {
  AppEntry,
  BackendAppConfig,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  composeNodeGenerator,
  dockerComposeGenerator,
  vitestGenerator,
} from '@halfdomelabs/core-generators';
import { backendAppEntryType } from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder } from '../app-entry-builder.js';
import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

export function buildDocker(
  projectDefinition: ProjectDefinition,
  app: BackendAppConfig,
): GeneratorBundle {
  return dockerComposeGenerator({
    postgres: getPostgresSettings(projectDefinition).config,
    ...(app.enableRedis
      ? { redis: getRedisSettings(projectDefinition).config }
      : {}),
  });
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

  const { projectDefinition } = appBuilder;

  const packageName = projectDefinition.packageScope
    ? `@${projectDefinition.packageScope}/${app.name}`
    : `${projectDefinition.name}-${app.name}`;

  const rootBundle = composeNodeGenerator({
    name: `${projectDefinition.name}-${app.name}`,
    packageName,
    description: `Backend app for ${projectDefinition.name}`,
    version: projectDefinition.version,
    children: {
      projects: [
        buildDocker(projectDefinition, app),
        buildFastify(appBuilder, app),
      ],
      vitest: vitestGenerator({}),
    },
  });
  return appBuilder.buildProjectEntry(rootBundle);
}
