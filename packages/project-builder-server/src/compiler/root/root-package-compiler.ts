import type {
  AppEntry,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import {
  nodeGenerator,
  nodeGitIgnoreGenerator,
  pathRootsGenerator,
  pnpmWorkspaceGenerator,
  prettierGenerator,
} from '@baseplate-dev/core-generators';

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
 * - Vitest (no tests in root)
 */
export const rootPackageCompiler = {
  compile(definitionContainer: ProjectDefinitionContainer): AppEntry {
    const projectDefinition = definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;
    const monorepoSettings = projectDefinition.settings.monorepo;

    // Build workspace patterns from monorepo settings
    const appsFolder = monorepoSettings?.appsFolder ?? 'apps';
    const workspacePackages = [`${appsFolder}/*`];

    const rootBundle = nodeGenerator({
      name: generalSettings.name,
      packageName: generalSettings.packageScope
        ? `@${generalSettings.packageScope}/root`
        : `${generalSettings.name}-root`,
      description: `Monorepo root for ${generalSettings.name}`,
      private: true,
      rootPackage: true,
      scripts: {
        'baseplate:serve': 'baseplate serve',
        'baseplate:generate': 'baseplate generate',
      },
      children: {
        gitIgnore: nodeGitIgnoreGenerator({}),
        prettier: prettierGenerator({}),
        workspacePackages: pnpmWorkspaceGenerator({
          packages: workspacePackages,
        }),
        pathRoots: pathRootsGenerator({}),
      },
    });

    return {
      id: 'root',
      name: 'root',
      appDirectory: '.', // Root of the monorepo
      generatorBundle: rootBundle,
    };
  },
};
