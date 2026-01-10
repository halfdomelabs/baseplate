import type {
  BaseLibraryDefinition,
  LibraryCompilerCreator,
  PackageEntry,
} from '@baseplate-dev/project-builder-lib';

import {
  composeNodeGenerator,
  nodeLibraryGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import {
  LibraryCompiler,
  nodeLibraryDefinitionSchemaEntry,
} from '@baseplate-dev/project-builder-lib';

class NodeLibraryPackageCompiler extends LibraryCompiler<BaseLibraryDefinition> {
  compile(): PackageEntry {
    const { packageConfig, definitionContainer } = this;
    const projectDefinition = definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;

    const packageName = this.getPackageName();
    const packageDirectory = this.getPackageDirectory();

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${packageConfig.name}`,
      packageName,
      description: `Library package for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({ includePlaceholderIndexFile: true }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
      },
    });

    return {
      id: packageConfig.id,
      name: packageConfig.name,
      packageDirectory,
      generatorBundle: rootBundle,
    };
  }
}

export const nodeLibraryCompilerCreator: LibraryCompilerCreator = {
  name: nodeLibraryDefinitionSchemaEntry.name,
  createCompiler: (definitionContainer, packageConfig) =>
    new NodeLibraryPackageCompiler(definitionContainer, packageConfig),
};
