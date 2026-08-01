import type {
  BaseAppConfig,
  BaseLibraryDefinition,
  MonorepoSettingsDefinition,
  ProjectDefinition,
} from '#src/schema/index.js';

import { AppUtils } from '#src/definition/apps/app-utils.js';
import { computeRelativePath } from '#src/utils/path.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): BaseLibraryDefinition {
  const config = projectDefinition.libraries.find((lib) => lib.id === id);
  if (!config) {
    throw new Error(`Unable to find library with ID ${id}`);
  }
  return config;
}

function byUniqueTypeOrThrow(
  projectDefinition: ProjectDefinition,
  type: string,
): BaseLibraryDefinition {
  const config = projectDefinition.libraries.filter((lib) => lib.type === type);
  const library = config[0];
  if (!library) {
    throw new Error(`Unable to find library with type ${type}`);
  }
  if (config.length > 1) {
    throw new Error(
      `Multiple libraries with type ${type} found and only one is expected (${config.map((lib) => lib.name).join(', ')})`,
    );
  }
  return library;
}

/**
 * Given a library config, get the relative directory of the library
 *
 * @param libraryConfig The library config
 * @param monorepoSettings Optional monorepo settings to determine libraries folder location
 * @returns The directory of the library
 */
function getLibraryDirectory(
  libraryConfig: BaseLibraryDefinition,
  monorepoSettings?: MonorepoSettingsDefinition,
): string {
  const librariesFolder = monorepoSettings?.librariesFolder ?? 'libs';
  return `${librariesFolder}/${libraryConfig.name}`;
}

/**
 * Given a library config and the app importing it, get the path to the
 * library's `src` directory relative to the app's `src` root (where
 * `styles.css` is rendered), for use in a Tailwind `@source` directive.
 *
 * @param libraryConfig The library config being imported
 * @param appConfig The app importing the library
 * @param monorepoSettings Optional monorepo settings to determine folder locations
 * @returns The relative path from the app's `src` root to the library's `src` directory
 */
function getLibraryRelativeSourcePath(
  libraryConfig: BaseLibraryDefinition,
  appConfig: BaseAppConfig,
  monorepoSettings?: MonorepoSettingsDefinition,
): string {
  const appSrcDirectory = `${AppUtils.getAppDirectory(appConfig, monorepoSettings)}/src`;
  const librarySrcDirectory = `${getLibraryDirectory(libraryConfig, monorepoSettings)}/src`;
  return computeRelativePath(appSrcDirectory, librarySrcDirectory);
}

export const LibraryUtils = {
  byId,
  byUniqueTypeOrThrow,
  getLibraryDirectory,
  getLibraryRelativeSourcePath,
};
