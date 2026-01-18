import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { BaseLibraryDefinition } from '#src/schema/libraries/base.js';
import type { MonorepoSettingsDefinition } from '#src/schema/settings/monorepo.js';

/**
 * Represents a compiled package entry ready for code generation
 *
 * A PackageEntry contains all information needed to generate code for a single
 * package in the monorepo, including its generator bundle and target directory.
 */
export interface PackageEntry {
  /** Unique identifier for the package */
  id: string;
  /** Package name */
  name: string;
  /** Relative directory path from project root (e.g., 'packages/utils', '.') */
  packageDirectory: string;
  /** Generator bundle containing all generation tasks for this package */
  generatorBundle: GeneratorBundle;
}

/**
 * Tasks for a package used in turbo configuration
 */
export interface PackageTasks {
  build: string[];
  dev: string[];
  watch: string[];
}

export interface PackageCompilerTasks {
  build: string[];
  dev: string[];
  watch: string[];
}

export interface PackageCompilerContext {
  compilers: PackageCompiler[];
}

/**
 * Abstract base class for package type compilers
 *
 * Each package type (backend, web, library, etc.) extends this class
 * to define how it should be compiled into a PackageEntry with generator bundles.
 *
 * Each child class defines its own constructor requirements based on what
 * information it needs (e.g., app config, definition container).
 */
export abstract class PackageCompiler {
  protected readonly definitionContainer: ProjectDefinitionContainer;

  constructor(definitionContainer: ProjectDefinitionContainer) {
    this.definitionContainer = definitionContainer;
  }
  /**
   * Compile a package configuration into a PackageEntry with generator bundle
   *
   * @returns PackageEntry with generated bundle ready for sync
   */
  abstract compile(context: PackageCompilerContext): PackageEntry;

  /**
   * Get the formatted package name (e.g., '@scope/backend' or 'project-backend')
   *
   * @returns Formatted package name
   */
  abstract getPackageName(): string;

  /**
   * Get the package directory path relative to monorepo root
   *
   * @returns Package directory path (e.g., 'apps/backend', '.')
   */
  abstract getPackageDirectory(): string;

  /**
   * Get the tasks for a package used in turbo configuration
   *
   * @returns Object with build, dev, and watch tasks
   */
  getTasks(): PackageTasks {
    return {
      build: [],
      dev: [],
      watch: [],
    };
  }
}

// ============================================================================
// Package Directory Helpers
// ============================================================================

export const DEFAULT_APPS_FOLDER = 'apps';
export const DEFAULT_LIBRARIES_FOLDER = 'libs';

/**
 * Build a scoped package name using the package scope or project name as scope
 *
 * @example
 * ```typescript
 * buildPackageName({ name: 'blog', packageScope: 'acme' }, 'utils')
 * // Returns: '@acme/utils'
 *
 * buildPackageName({ name: 'blog', packageScope: '' }, 'utils')
 * // Returns: '@blog/utils'
 * ```
 */
export function buildPackageName(
  generalSettings: { name: string; packageScope: string },
  packageName: string,
): string {
  const scope = generalSettings.packageScope || generalSettings.name;
  return `@${scope}/${packageName}`;
}

/**
 * Get the package directory for an app or library package based off
 * the monorepo settings and package name
 */
export function getPackageDirectory(
  monorepoSettings: MonorepoSettingsDefinition | undefined,
  packageName: string,
  packageType: 'app' | 'library',
): string {
  const folder =
    packageType === 'app'
      ? (monorepoSettings?.appsFolder ?? DEFAULT_APPS_FOLDER)
      : (monorepoSettings?.librariesFolder ?? DEFAULT_LIBRARIES_FOLDER);
  return `${folder}/${packageName}`;
}

// ============================================================================
// Library Compiler Base Class
// ============================================================================

/**
 * Abstract base class for library package compilers
 *
 * Library packages differ from app packages in that they:
 * - Don't use the plugin system (no AppEntryBuilder)
 * - Use the librariesFolder instead of appsFolder
 * - Have simpler compilation without app-specific features
 */
export abstract class LibraryCompiler<
  TPackageConfig extends BaseLibraryDefinition,
> extends PackageCompiler {
  protected readonly packageConfig: TPackageConfig;

  constructor(
    definitionContainer: ProjectDefinitionContainer,
    packageConfig: TPackageConfig,
  ) {
    super(definitionContainer);
    this.packageConfig = packageConfig;
  }

  getPackageName(): string {
    const generalSettings =
      this.definitionContainer.definition.settings.general;
    return buildPackageName(generalSettings, this.packageConfig.name);
  }

  getPackageDirectory(): string {
    const monorepoSettings =
      this.definitionContainer.definition.settings.monorepo;
    return getPackageDirectory(
      monorepoSettings,
      this.packageConfig.name,
      'library',
    );
  }
}
