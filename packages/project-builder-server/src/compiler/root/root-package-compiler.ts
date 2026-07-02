import type {
  PackageCompilerContext,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  CORE_PACKAGES,
  dockerComposeGenerator,
  nodeGenerator,
  nodeGitIgnoreGenerator,
  pathRootsGenerator,
  pnpmWorkspaceGenerator,
  prettierGenerator,
  rootReadmeGenerator,
  turboGenerator,
} from '@baseplate-dev/core-generators';
import {
  buildPackageName,
  DEFAULT_APPS_FOLDER,
  DEFAULT_LIBRARIES_FOLDER,
  PackageCompiler,
  rootCompilerSpec,
} from '@baseplate-dev/project-builder-lib';
import { compareStrings } from '@baseplate-dev/utils';
import { uniq } from 'es-toolkit';

import type { PackageEntry } from '../package-entry.js';

import {
  getPostgresSettings,
  getRedisSettings,
  isRedisEnabled,
} from '../infrastructure-utils.js';

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
    const appsFolder = monorepoSettings?.appsFolder ?? DEFAULT_APPS_FOLDER;
    const librariesFolder =
      monorepoSettings?.librariesFolder ?? DEFAULT_LIBRARIES_FOLDER;
    const workspacePackages = [`${appsFolder}/*`, `${librariesFolder}/*`];

    const tasks = context.compilers.map((compiler) => compiler.getTasks());
    const sortedUniq = (items: string[]): string[] =>
      uniq(items).sort(compareStrings);
    const allPrebuildTasks = tasks.flatMap((task) => task.prebuild);
    const uniquePrebuildTasks = [
      ...new Map(allPrebuildTasks.map((t) => [t.name, t])).values(),
    ];
    const mergedTasks = {
      prebuild: uniquePrebuildTasks,
      build: sortedUniq(tasks.flatMap((task) => task.build)),
      check: sortedUniq(tasks.flatMap((task) => task.check)),
      dev: sortedUniq(tasks.flatMap((task) => task.dev)),
      watch: sortedUniq(tasks.flatMap((task) => task.watch)),
    };
    const prebuildTaskNames = mergedTasks.prebuild.map((t) => t.name);
    const turboTasks = [
      ...mergedTasks.dev.map((task) => ({
        name: task,
        persistent: true,
        cache: false,
      })),
      ...mergedTasks.prebuild.map((task) => ({
        name: task.name,
        inputs: task.inputs,
        outputs: task.outputs,
      })),
      ...mergedTasks.build.map((task) => ({
        dependsOn: ['^build', ...prebuildTaskNames],
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
      {
        name: 'typecheck',
        ...(prebuildTaskNames.length > 0
          ? { dependsOn: prebuildTaskNames }
          : {}),
      },
      {
        name: 'lint',
        dependsOn: ['^build', ...prebuildTaskNames],
      },
      {
        name: 'test',
        dependsOn: ['^build', ...prebuildTaskNames],
      },
      { name: 'prettier:check' },
      { name: 'prettier:check:root' },
      { name: 'prettier:write', cache: false },
      { name: 'prettier:write:root', cache: false },
    ];

    const buildTasks = mergedTasks.build.join(' ');
    const checkTasks = mergedTasks.check.join(' ');
    const devTasks = mergedTasks.dev.join(' ');
    const watchTasks = mergedTasks.watch.join(' ');

    // Collect root-level generator children from plugins
    const rootCompilerStore =
      this.definitionContainer.pluginStore.use(rootCompilerSpec);
    const pluginChildren = rootCompilerStore.compileAll({
      projectDefinition,
      definitionContainer: this.definitionContainer,
    });

    const { cliVersion } = this.definitionContainer.parserContext;

    const packageName = buildPackageName(generalSettings, 'root');

    const rootBundle = nodeGenerator({
      name: generalSettings.name,
      packageName,
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
        ...(checkTasks.length > 0
          ? { check: `turbo run ${checkTasks} --affected --continue` }
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
        'prettier:check:root': `prettier --check . "!${appsFolder}/**" "!${librariesFolder}/**"`,
        'prettier:write:root': `prettier --write --list-different . "!${appsFolder}/**" "!${librariesFolder}/**"`,
      },
      additionalPackages: {
        dev: {
          // only include the project-builder-cli package for user projects (not examples or tests)
          ...(this.definitionContainer.parserContext.project.type === 'user'
            ? {
                '@baseplate-dev/project-builder-cli': cliVersion,
              }
            : {}),
          // Include Typescript to allow tsconfig plugins like gql.tada to be used
          typescript: CORE_PACKAGES.typescript,
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
          // Approve/acknowledge the build-script dependencies a generated
          // project pulls in, so `pnpm install` runs cleanly with no prompt and
          // no warning:
          //   - Prisma's engine is approved (`true`) so it builds.
          //   - The remaining known build-script deps are transitive tooling
          //     that ship prebuilt binaries (esbuild, unrs-resolver,
          //     @parcel/watcher); we acknowledge them as `false` so pnpm skips
          //     their builds silently instead of warning.
          // `strictDepBuilds: false` (set in the generator) remains the safety
          // net: any build-script dep NOT listed here still installs and only
          // emits a warning rather than failing.
          allowBuilds: {
            '@prisma/engines': true,
            prisma: true,
            esbuild: false,
            'unrs-resolver': false,
            '@parcel/watcher': false,
          },
        }),
        pathRoots: pathRootsGenerator({}),
        turbo: turboGenerator({
          tasks: turboTasks,
        }),
        rootReadme: rootReadmeGenerator({
          projectName: generalSettings.name,
        }),
        ...pluginChildren,
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
