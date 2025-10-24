import type {
  AppEntry,
  AppEntryType,
  BaseAppConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { AppEntryBuilder } from './app-entry-builder.js';

/**
 * Interface for package type compilers
 *
 * Each package type (backend, web, library, etc.) implements this interface
 * to define how it should be compiled into an AppEntry with generator bundles.
 *
 * Package compilers are created via factory functions that return objects
 * implementing this interface.
 */
export interface PackageCompiler<
  TConfig extends BaseAppConfig = BaseAppConfig,
> {
  /**
   * Compile a package configuration into an AppEntry with generator bundle
   *
   * @param definitionContainer - The project definition container with full context
   * @param appConfig - The package configuration to compile
   * @returns AppEntry with generated bundle ready for sync
   */
  compile(
    definitionContainer: ProjectDefinitionContainer,
    appConfig: TConfig,
  ): AppEntry;
}

/**
 * Build a package name following monorepo naming conventions
 *
 * If packageScope is set, creates scoped package: @scope/name
 * Otherwise, creates prefixed package: project-name
 *
 * @param generalSettings - Project general settings
 * @param appName - The app/package name
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
  appName: string,
): string {
  return generalSettings.packageScope
    ? `@${generalSettings.packageScope}/${appName}`
    : `${generalSettings.name}-${appName}`;
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
