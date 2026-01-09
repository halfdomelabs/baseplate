import type {
  BasePackageConfig,
  MonorepoSettingsDefinition,
  ProjectDefinition,
} from '#src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePackageConfig {
  const config = projectDefinition.packages.find((pkg) => pkg.id === id);
  if (!config) {
    throw new Error(`Unable to find package with ID ${id}`);
  }
  return config;
}

/**
 * Given a package config, get the relative directory of the package
 *
 * @param packageConfig The package config
 * @param monorepoSettings Optional monorepo settings to determine packages folder location
 * @returns The directory of the package
 */
function getPackageDirectory(
  packageConfig: BasePackageConfig,
  monorepoSettings?: MonorepoSettingsDefinition,
): string {
  const packagesFolder = monorepoSettings?.packagesFolder ?? 'packages';
  return `${packagesFolder}/${packageConfig.name}`;
}

export const PackageUtils = {
  byId,
  getPackageDirectory,
};
