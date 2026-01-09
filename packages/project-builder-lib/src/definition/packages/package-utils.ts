import type {
  BaseLibraryDefinition,
  MonorepoSettingsDefinition,
  ProjectDefinition,
} from '#src/schema/index.js';

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

export const PackageUtils = {
  byId,
  getLibraryDirectory,
};
