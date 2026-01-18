import type {
  BackendAppConfig,
  PackageTasks,
} from '@baseplate-dev/project-builder-lib';

import {
  composeNodeGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import {
  backendAppEntryType,
  buildPackageName,
} from '@baseplate-dev/project-builder-lib';

import type { PackageEntry } from '../package-entry.js';

import { AppCompiler } from '../app-compiler.js';
import { createAppEntryBuilderForPackage } from '../package-compiler.js';
import { buildFastify } from './fastify.js';

/**
 * Compiler for backend packages
 *
 * Generates a Fastify-based backend application with:
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
