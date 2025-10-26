import type {
  AppEntryType,
  BaseAppConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import type { PackageEntry } from './package-entry.js';

import { AppEntryBuilder } from './app-entry-builder.js';

/**
 * Interface for package type compilers
 *
 * Each package type (backend, web, library, etc.) implements this interface
 * to define how it should be compiled into a PackageEntry with generator bundles.
 *
 * Package compilers are created via factory functions that return objects
 * implementing this interface.
 */
export interface PackageCompiler<
  TConfig extends BaseAppConfig = BaseAppConfig,
> {
  /**
   * Compile a package configuration into a PackageEntry with generator bundle
   *
   * @param definitionContainer - The project definition container with full context
   * @param packageConfig - The package configuration to compile
   * @returns PackageEntry with generated bundle ready for sync
   */
  compile(
    definitionContainer: ProjectDefinitionContainer,
    packageConfig: TConfig,
  ): PackageEntry;
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
