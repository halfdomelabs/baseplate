import {
  nodeGenerator,
  nodeGitIgnoreGenerator,
  pathRootsGenerator,
  pnpmWorkspaceGenerator,
  prettierGenerator,
  turboGenerator,
} from '@baseplate-dev/core-generators';
import { uniq } from 'es-toolkit';

import type { PackageCompilerContext } from '../package-compiler.js';
import type { PackageEntry } from '../package-entry.js';

import { buildPackageName, PackageCompiler } from '../package-compiler.js';

/**
 * Compiler for monorepo root package
 *
 * Generates:
 * - package.json with workspace scripts
 * - pnpm-workspace.yaml with workspace patterns
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
    const workspacePackages = [`${appsFolder}/*`];

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
        build: `turbo run ${buildTasks}`,
        'build:affected': `turbo run ${buildTasks} --affected`,
        typecheck: `turbo run typecheck`,
        lint: `turbo run lint`,
        'lint:affected': `turbo run lint --affected`,
        test: `turbo run test`,
        'prettier:check': `turbo run prettier:check && pnpm run prettier:check:root`,
        'prettier:check:affected': `turbo run prettier:check --affected`,
        'prettier:write': `turbo run prettier:write && pnpm run prettier:write:root`,
        dev: `turbo run ${devTasks}`,
        watch: `turbo run ${watchTasks}`,
        'baseplate:serve': 'baseplate serve',
        'baseplate:generate': 'baseplate generate',
        'prettier:check:root': 'prettier --check .',
        'prettier:write:root': 'prettier --write .',
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
        gitIgnore: nodeGitIgnoreGenerator({}),
        prettier: prettierGenerator({
          disableDefaultScripts: true,
          additionalIgnorePaths: [`/${appsFolder}/**`, '.turbo/**'],
        }),
        workspacePackages: pnpmWorkspaceGenerator({
          packages: workspacePackages,
        }),
        pathRoots: pathRootsGenerator({}),
        turbo: turboGenerator({
          tasks: turboTasks,
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
