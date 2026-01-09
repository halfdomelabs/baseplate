import type {
  BasePackageConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import {
  libraryTypeSpec,
  PackageCompiler,
} from '@baseplate-dev/project-builder-lib';

import { buildPackageName, getPackageDirectory } from '../package-compiler.js';

/**
 * Abstract base class for library package compilers
 *
 * Library packages differ from app packages in that they:
 * - Don't use the plugin system (no AppEntryBuilder)
 * - Use the packagesFolder instead of appsFolder
 * - Have simpler compilation without app-specific features
 */
export abstract class LibraryCompiler<
  TPackageConfig extends BasePackageConfig,
> extends PackageCompiler {
  protected readonly packageConfig: TPackageConfig;

  constructor(
    definitionContainer: ProjectDefinitionContainer,
    packageConfig: TPackageConfig,
  ) {
    super(definitionContainer);
    this.packageConfig = packageConfig;
  }

  getPackageName(): string {
    const generalSettings =
      this.definitionContainer.definition.settings.general;
    return buildPackageName(generalSettings, this.packageConfig.name);
  }

  getPackageDirectory(): string {
    const monorepoSettings =
      this.definitionContainer.definition.settings.monorepo;
    return getPackageDirectory(
      monorepoSettings,
      this.packageConfig.name,
      'library',
    );
  }
}

export function createLibraryCompilerFromSpec(
  definitionContainer: ProjectDefinitionContainer,
  packageConfig: BasePackageConfig,
): PackageCompiler {
  const typeSpec = definitionContainer.pluginStore.use(libraryTypeSpec);
  const compilerCreator = typeSpec.compilerCreators.get(packageConfig.type);
  if (!compilerCreator) {
    throw new Error(`Unknown library type: ${packageConfig.type}`);
  }
  return compilerCreator.createCompiler(definitionContainer, packageConfig);
}
