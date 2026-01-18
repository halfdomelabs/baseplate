import { createSchemaMigration } from './types.js';

interface LibraryConfig {
  id: string;
  type: string;
  name: string;
  [key: string]: unknown;
}

interface MonorepoSettings {
  appsFolder?: string;
  packagesFolder?: string;
  librariesFolder?: string;
}

interface Settings {
  monorepo?: MonorepoSettings;
  [key: string]: unknown;
}

interface OldConfig {
  packages?: LibraryConfig[];
  settings?: Settings;
  [key: string]: unknown;
}

interface NewConfig {
  libraries?: LibraryConfig[];
  settings?: Settings;
  [key: string]: unknown;
}

/**
 * Migration to rename packages to libraries
 *
 * This migration:
 * 1. Renames the top-level `packages` field to `libraries`
 * 2. Updates package IDs from `package:*` to `library:*`
 * 3. Renames `settings.monorepo.packagesFolder` to `settings.monorepo.librariesFolder`
 *    and changes the default from 'packages' to 'libs'
 */
export const migration022RenamePackagesToLibraries = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 22,
  name: 'renamePackagesToLibraries',
  description:
    'Rename packages to libraries and packagesFolder to librariesFolder',
  migrate: (config) => {
    const { packages, settings, ...rest } = config;

    // Rename packages to libraries and update IDs
    const libraries = packages?.map((pkg) => ({
      ...pkg,
      id: pkg.id.replace(/^package:/, 'library:'),
    }));

    // Update monorepo settings if present
    let newSettings = settings;
    if (settings?.monorepo) {
      const { packagesFolder, ...restMonorepo } = settings.monorepo;
      newSettings = {
        ...settings,
        monorepo: {
          ...restMonorepo,
          // If packagesFolder was explicitly set to 'packages' (old default) or not set,
          // use 'libs' (new default). Otherwise preserve the custom value.
          librariesFolder:
            packagesFolder === undefined || packagesFolder === 'packages'
              ? 'libs'
              : packagesFolder,
        },
      };
    }

    return {
      ...rest,
      libraries,
      settings: newSettings,
    } as NewConfig;
  },
});
