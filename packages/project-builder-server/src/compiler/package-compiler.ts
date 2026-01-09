import type {
  AppEntryType,
  BaseAppConfig,
  MonorepoSettingsDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { AppEntryBuilder } from './app-entry-builder.js';

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

export const DEFAULT_APPS_FOLDER = 'apps';
export const DEFAULT_PACKAGES_FOLDER = 'packages';

/**
 * Get the package directory for an app or library package based off
 * the monorepo settings and package name
 */
export function getPackageDirectory(
  monorepoSettings: MonorepoSettingsDefinition | undefined,
  packageName: string,
  packageType: 'app' | 'library',
): string {
  const packagesFolder =
    packageType === 'app'
      ? (monorepoSettings?.appsFolder ?? DEFAULT_APPS_FOLDER)
      : (monorepoSettings?.packagesFolder ?? DEFAULT_PACKAGES_FOLDER);
  return `${packagesFolder}/${packageType}/${packageName}`;
}
