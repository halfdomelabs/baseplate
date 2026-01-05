import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  dockerComposeGenerator,
  nodeGenerator,
  nodeGitIgnoreGenerator,
  pathRootsGenerator,
  pnpmWorkspaceGenerator,
  prettierGenerator,
  rootReadmeGenerator,
  turboGenerator,
} from '@baseplate-dev/core-generators';
import { uniq } from 'es-toolkit';

import type { PackageCompilerContext } from '../package-compiler.js';
import type { PackageEntry } from '../package-entry.js';

import {
  getPostgresSettings,
  getRedisSettings,
  isRedisEnabled,
} from '../infrastructure-utils.js';
import { buildPackageName, PackageCompiler } from '../package-compiler.js';

/**
 * Build Docker Compose configuration at root level
 *
 * Always includes Postgres, optionally includes Redis if enabled in infrastructure settings
 *
 * @param projectDefinition - The project definition containing infrastructure settings
 * @returns Generator bundle for Docker Compose
 */
function buildDocker(projectDefinition: ProjectDefinition): GeneratorBundle {
  return dockerComposeGenerator({
    postgres: getPostgresSettings(projectDefinition).config,
    ...(isRedisEnabled(projectDefinition)
      ? { redis: getRedisSettings(projectDefinition).config }
      : {}),
  });
}

/**
 * Compiler for monorepo root package
 *
 * Generates:
 * - package.json with workspace scripts
 * - pnpm-workspace.yaml with workspace patterns
 * - Docker Compose configuration (Postgres, optional Redis)
 * - Basic tooling (prettier, gitignore)
 *
 * Does NOT include:
 * - TypeScript/tsconfig (no code in root)
 * - ESLint
 * - Vitest (no tests in root)
 */
export class RootPackageCompiler extends PackageCompiler {
  compile(context: PackageCompilerContext): PackageEntry {
    const projectDefinition = this.definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;
    const monorepoSettings = projectDefinition.settings.monorepo;

    // Build workspace patterns from monorepo settings
    const appsFolder = monorepoSettings?.appsFolder ?? 'apps';
    const packagesFolder = monorepoSettings?.packagesFolder ?? 'packages';
    const workspacePackages = [`${appsFolder}/*`, `${packagesFolder}/*`];

    const tasks = context.compilers.map((compiler) => compiler.getTasks());
    const mergedTasks = {
      dev: uniq(tasks.flatMap((task) => task.dev)),
      build: uniq(tasks.flatMap((task) => task.build)),
      watch: uniq(tasks.flatMap((task) => task.watch)),
    };
    const turboTasks = [
      ...mergedTasks.dev.map((task) => ({
        name: task,
        persistent: true,
        cache: false,
      })),
      ...mergedTasks.build.map((task) => ({
        inputs: ['$TURBO_DEFAULT$', '!README.md', '!**/*.test.ts'],
        outputs: ['build/**', 'dist/**', '.next/**', '!.next/cache/**'],
        name: task,
        persistent: false,
      })),
      ...mergedTasks.watch.map((task) => ({
        name: task,
        persistent: true,
        cache: false,
      })),
      { name: 'typecheck' },
      { name: 'lint', dependsOn: ['^build'], outputLogs: 'new-only' },
      { name: 'test', dependsOn: ['^build'], outputLogs: 'errors-only' },
      { name: 'prettier:check' },
      { name: 'prettier:check:root' },
      { name: 'prettier:write', cache: false },
      { name: 'prettier:write:root', cache: false },
    ];

    const devTasks = mergedTasks.dev.join(' ');
    const buildTasks = mergedTasks.build.join(' ');
    const watchTasks = mergedTasks.watch.join(' ');

    const { cliVersion } = this.definitionContainer.parserContext;

    const rootBundle = nodeGenerator({
      name: generalSettings.name,
      packageName: generalSettings.packageScope
        ? `@${generalSettings.packageScope}/root`
        : `${generalSettings.name}-root`,
      description: `Monorepo root for ${generalSettings.name}`,
      private: true,
      rootPackage: true,
      scripts: {
        ...(buildTasks.length > 0
          ? {
              build: `turbo run ${buildTasks}`,
              'build:affected': `turbo run ${buildTasks} --affected`,
            }
          : {}),
        typecheck: `turbo run typecheck`,
        lint: `turbo run lint`,
        'lint:affected': `turbo run lint --affected`,
        test: `turbo run test`,
        'test:affected': `turbo run test --affected`,
        'prettier:check': `turbo run prettier:check && pnpm run prettier:check:root`,
        'prettier:check:affected': `turbo run prettier:check --affected`,
        'prettier:write': `turbo run prettier:write && pnpm run prettier:write:root`,
        ...(devTasks.length > 0 ? { dev: `turbo run ${devTasks}` } : {}),
        ...(watchTasks.length > 0 ? { watch: `turbo run ${watchTasks}` } : {}),
        'baseplate:serve': 'baseplate serve',
        'baseplate:generate': 'baseplate generate',
        'prettier:check:root': `prettier --check . "!${appsFolder}/**" "!${packagesFolder}/**"`,
        'prettier:write:root': `prettier --write . "!${appsFolder}/**" "!${packagesFolder}/**"`,
      },
      additionalPackages: {
        dev: {
          // only include the project-builder-cli package if the project is not an internal example
          ...(this.definitionContainer.parserContext.project.isInternalExample
            ? {}
            : {
                '@baseplate-dev/project-builder-cli': cliVersion,
              }),
        },
      },
      children: {
        docker: buildDocker(projectDefinition),
        gitIgnore: nodeGitIgnoreGenerator({
          additionalExclusions: ['# Turbo build artifacts', '.turbo/**'],
        }),
        prettier: prettierGenerator({
          disableDefaultScripts: true,
          additionalIgnorePaths: ['.turbo/**', 'pnpm-workspace.yaml'],
        }),
        workspacePackages: pnpmWorkspaceGenerator({
          packages: workspacePackages,
        }),
        pathRoots: pathRootsGenerator({}),
        turbo: turboGenerator({
          tasks: turboTasks,
        }),
        rootReadme: rootReadmeGenerator({
          projectName: generalSettings.name,
        }),
      },
    });

    return {
      id: 'root',
      name: 'root',
      packageDirectory: this.getPackageDirectory(), // Root of the monorepo
      generatorBundle: rootBundle,
    };
  }

  getPackageName(): string {
    const generalSettings =
      this.definitionContainer.definition.settings.general;
    return buildPackageName(generalSettings, 'root');
  }

  getPackageDirectory(): string {
    return '.';
  }
}
