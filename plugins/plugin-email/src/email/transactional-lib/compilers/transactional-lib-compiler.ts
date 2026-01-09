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
import { LibraryCompiler } from '@baseplate-dev/project-builder-lib';

import { transactionalLibGenerator } from '../generators/transactional-lib/index.js';
import { transactionalLibDefinitionSchemaEntry } from '../schema/transactional-lib-definition.js';

/**
 * Compiler for transactional-lib library type.
 *
 * Creates a React Email-based transactional email library with reusable
 * components, themes, and email rendering utilities.
 */
class TransactionalLibPackageCompiler extends LibraryCompiler<BaseLibraryDefinition> {
  compile(): PackageEntry {
    const projectDefinition = this.definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;

    const packageName = this.getPackageName();
    const packageDirectory = this.getPackageDirectory();

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${this.packageConfig.name}`,
      packageName,
      description: `Transactional email library for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({ includePlaceholderIndexFile: true }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
        transactional: transactionalLibGenerator({}),
      },
    });

    return {
      id: this.packageConfig.id,
      name: this.packageConfig.name,
      packageDirectory,
      generatorBundle: rootBundle,
    };
  }
}

export const transactionalLibCompilerCreator: LibraryCompilerCreator = {
  name: transactionalLibDefinitionSchemaEntry.name,
  createCompiler: (definitionContainer, packageConfig) =>
    new TransactionalLibPackageCompiler(definitionContainer, packageConfig),
};
