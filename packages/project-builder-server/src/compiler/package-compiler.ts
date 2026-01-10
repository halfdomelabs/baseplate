import type {
  AppEntryType,
  BaseAppConfig,
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
