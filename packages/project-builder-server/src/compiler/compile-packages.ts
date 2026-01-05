import type {
  AppConfig,
  PackageConfig,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';
import { sortBy } from 'es-toolkit';

import type {
  PackageCompiler,
  PackageCompilerContext,
} from './package-compiler.js';
import type { PackageEntry } from './package-entry.js';

import { BackendPackageCompiler } from './backend/index.js';
import { NodeLibraryCompiler } from './library/index.js';
import { RootPackageCompiler } from './root/index.js';
import { WebPackageCompiler } from './web/index.js';

/**
 * Create a package compiler instance based on app type
 *
 * @param definitionContainer - The project definition container
 * @param app - The app configuration
 * @returns PackageCompiler instance for the app type
 */
function createAppCompiler(
  definitionContainer: ProjectDefinitionContainer,
  app: AppConfig,
): PackageCompiler {
  switch (app.type) {
    case 'backend': {
      return new BackendPackageCompiler(definitionContainer, app);
    }
    case 'web': {
      return new WebPackageCompiler(definitionContainer, app);
    }
    default: {
      throw new Error(`Unknown app type: ${(app as AppConfig).type}`);
    }
  }
}

/**
 * Create a library compiler instance based on package type
 *
 * @param definitionContainer - The project definition container
 * @param pkg - The package configuration
 * @returns PackageCompiler instance for the package type
 */
function createLibraryCompiler(
  definitionContainer: ProjectDefinitionContainer,
  pkg: PackageConfig,
): PackageCompiler {
  // Cast to string to support future package types without lint errors
  const pkgType = pkg.type as string;
  switch (pkgType) {
    case 'node-library': {
      return new NodeLibraryCompiler(definitionContainer, pkg);
    }
    default: {
      throw new Error(`Unknown package type: ${pkgType}`);
    }
  }
}

/**
 * Compile all packages in a project definition
 *
 * Root package is compiled first, then backend apps, then other apps, then library packages.
 *
 * @param projectJson - Serialized project definition JSON
 * @param context - Schema parser context
 * @returns Array of compiled package entries with generator bundles (root first, then apps, then libraries)
 */
export function compilePackages(
  projectJson: unknown,
  context: SchemaParserContext,
): PackageEntry[] {
  const definitionContainer = ProjectDefinitionContainer.fromSerializedConfig(
    projectJson,
    context,
  );

  const appConfigs = sortBy(definitionContainer.definition.apps, [
    (a) => (a.type === 'backend' ? 0 : 1),
    (a) => a.name,
  ]);

  // Get library packages sorted by name
  const packageConfigs = sortBy(definitionContainer.definition.packages, [
    (p) => p.name,
  ]);

  // Instantiate all package compilers
  const compilers = [
    new RootPackageCompiler(definitionContainer),
    ...appConfigs.map((app) => createAppCompiler(definitionContainer, app)),
    ...packageConfigs.map((pkg) =>
      createLibraryCompiler(definitionContainer, pkg),
    ),
  ];

  const compilerContext: PackageCompilerContext = {
    compilers,
  };

  // Compile all packages
  const packages = compilers.map((compiler) =>
    compiler.compile(compilerContext),
  );

  return packages;
}
