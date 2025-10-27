import type {
  BackendAppConfig,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  composeNodeGenerator,
  dockerComposeGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import { backendAppEntryType } from '@baseplate-dev/project-builder-lib';

import type { PackageTasks } from '../package-compiler.js';
import type { PackageEntry } from '../package-entry.js';

import { AppCompiler } from '../app-compiler.js';
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
export class BackendPackageCompiler extends AppCompiler<BackendAppConfig> {
  compile(): PackageEntry {
    const appBuilder = createAppEntryBuilderForPackage(
      this.definitionContainer,
      this.appConfig,
      backendAppEntryType,
    );

    const { projectDefinition } = appBuilder;
    const generalSettings = projectDefinition.settings.general;

    const packageName = buildPackageName(generalSettings, this.appConfig.name);

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${this.appConfig.name}`,
      packageName,
      description: `Backend app for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        docker: buildDocker(projectDefinition, this.appConfig),
        fastify: buildFastify(appBuilder, this.appConfig),
        vitest: vitestGenerator({}),
      },
    });

    return appBuilder.buildProjectEntry(rootBundle, this.getPackageDirectory());
  }

  getTasks(): PackageTasks {
    return {
      build: ['build'],
      dev: ['dev'],
      watch: [],
    };
  }
}
