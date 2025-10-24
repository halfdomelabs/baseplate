import type {
  AppEntry,
  BackendAppConfig,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  composeNodeGenerator,
  dockerComposeGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import { backendAppEntryType } from '@baseplate-dev/project-builder-lib';

import type { PackageCompiler } from '../package-compiler.js';

import {
  buildPackageName,
  createAppEntryBuilderForPackage,
} from '../package-compiler.js';
import { buildFastify } from './fastify.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

/**
 * Build Docker Compose configuration
 *
 * Always includes Postgres, optionally includes Redis if enabled
 */
function buildDocker(
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

/**
 * Compiler for backend packages
 *
 * Generates a Fastify-based backend application with:
 * - Docker Compose configuration (Postgres, optional Redis)
 * - Fastify application with GraphQL (Pothos) and REST endpoints
 * - Vitest testing setup
 * - Plugin-contributed generators (auth, storage, etc.)
 */
export const backendPackageCompiler: PackageCompiler<BackendAppConfig> = {
  compile(
    definitionContainer: ProjectDefinitionContainer,
    appConfig: BackendAppConfig,
  ): AppEntry {
    const appBuilder = createAppEntryBuilderForPackage(
      definitionContainer,
      appConfig,
      backendAppEntryType,
    );

    const { projectDefinition } = appBuilder;
    const generalSettings = projectDefinition.settings.general;

    const packageName = buildPackageName(generalSettings, appConfig.name);

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${appConfig.name}`,
      packageName,
      description: `Backend app for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        docker: buildDocker(projectDefinition, appConfig),
        fastify: buildFastify(appBuilder, appConfig),
        vitest: vitestGenerator({}),
      },
    });

    return appBuilder.buildProjectEntry(rootBundle);
  },
};
