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

function byUniqueTypeOrThrow(
  projectDefinition: ProjectDefinition,
  type: string,
): BaseLibraryDefinition {
  const config = projectDefinition.libraries.filter((lib) => lib.type === type);
  if (config.length === 0) {
    throw new Error(`Unable to find library with type ${type}`);
  }
  if (config.length > 1) {
    throw new Error(
      `Multiple libraries with type ${type} found and only one is expected (${config.map((lib) => lib.name).join(', ')})`,
    );
  }
  return config[0];
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

export const LibraryUtils = {
  byId,
  byUniqueTypeOrThrow,
  getLibraryDirectory,
};
