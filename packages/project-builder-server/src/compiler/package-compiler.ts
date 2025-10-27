import type {
  AppEntryType,
  BaseAppConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import type { PackageEntry } from './package-entry.js';

import { AppEntryBuilder } from './app-entry-builder.js';

export interface PackageTasks {
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

/**
 * Build a package name following monorepo naming conventions
 *
 * If packageScope is set, creates scoped package: @scope/name
 * Otherwise, creates prefixed package: project-name
 *
 * @param generalSettings - Project general settings
 * @param packageName - The app/package name
 * @returns Formatted package name
 *
 * @example
 * ```typescript
 * buildPackageName({ name: 'blog', packageScope: 'acme' }, 'backend')
 * // Returns: '@acme/backend'
 *
 * buildPackageName({ name: 'blog', packageScope: '' }, 'backend')
 * // Returns: 'blog-backend'
 * ```
 */
export function buildPackageName(
  generalSettings: { name: string; packageScope: string },
  packageName: string,
): string {
  return generalSettings.packageScope
    ? `@${generalSettings.packageScope}/${packageName}`
    : `${generalSettings.name}-${packageName}`;
}

/**
 * Create an AppEntryBuilder for a package
 *
 * The AppEntryBuilder manages the AppCompiler state and plugin coordination
 * for the package compilation process.
 *
 * @param definitionContainer - The project definition container
 * @param appConfig - The package configuration
 * @param appConfigType - The package type marker (backend, web, etc.)
 * @returns Configured AppEntryBuilder instance
 */
export function createAppEntryBuilderForPackage<
  TAppConfig extends BaseAppConfig,
>(
  definitionContainer: ProjectDefinitionContainer,
  appConfig: TAppConfig,
  appConfigType: AppEntryType<TAppConfig>,
): AppEntryBuilder<TAppConfig> {
  return new AppEntryBuilder(definitionContainer, appConfig, appConfigType);
}
