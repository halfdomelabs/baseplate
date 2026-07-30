import type {
  BaseLibraryDefinition,
  LibraryCompilerCreator,
  PackageEntry,
  PackageTasks,
} from '@baseplate-dev/project-builder-lib';

import {
  composeNodeGenerator,
  nodeLibraryGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import {
  LibraryCompiler,
  reactLibraryDefinitionSchemaEntry,
} from '@baseplate-dev/project-builder-lib';
import { reactLibraryGenerator } from '@baseplate-dev/react-generators';

class ReactLibraryPackageCompiler extends LibraryCompiler<BaseLibraryDefinition> {
  compile(): PackageEntry {
    const { packageConfig, definitionContainer } = this;
    const projectDefinition = definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;

    const packageName = this.getPackageName();
    const packageDirectory = this.getPackageDirectory();

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${packageConfig.name}`,
      packageName,
      description: `React library package for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({ includePlaceholderIndexFile: true }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
        reactLibrary: reactLibraryGenerator({}),
      },
    });

    return {
      id: packageConfig.id,
      name: packageConfig.name,
      packageDirectory,
      generatorBundle: rootBundle,
    };
  }

  getTasks(): PackageTasks {
    return {
      prebuild: [],
      build: ['build'],
      check: ['lint', 'typecheck', 'test', 'prettier:check'],
      dev: ['watch'],
      watch: ['watch'],
    };
  }
}

export const reactLibraryCompilerCreator: LibraryCompilerCreator = {
  name: reactLibraryDefinitionSchemaEntry.name,
  createCompiler: (definitionContainer, packageConfig) =>
    new ReactLibraryPackageCompiler(definitionContainer, packageConfig),
};
