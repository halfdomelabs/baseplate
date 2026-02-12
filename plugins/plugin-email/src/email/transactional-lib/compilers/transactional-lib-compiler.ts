import type {
  BaseLibraryDefinition,
  LibraryCompilerCreator,
  PackageEntry,
  PackageTasks,
} from '@baseplate-dev/project-builder-lib';
import type { AnyGeneratorBundle } from '@baseplate-dev/sync';

import {
  composeNodeGenerator,
  nodeLibraryGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';
import { LibraryCompiler } from '@baseplate-dev/project-builder-lib';

import { emailTemplateSpec } from '../email-template-spec.js';
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

    // Collect plugin-registered email template generators
    const emailTemplateStore =
      this.definitionContainer.pluginStore.use(emailTemplateSpec);
    const pluginChildren: Record<string, AnyGeneratorBundle> = {};
    for (const [index, generator] of emailTemplateStore.generators.entries()) {
      pluginChildren[`emailPlugin${index}`] = generator;
    }

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${this.packageConfig.name}`,
      packageName,
      description: `Transactional email library for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({ includePlaceholderIndexFile: false }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
        transactional: transactionalLibGenerator({}),
        ...pluginChildren,
      },
    });

    return {
      id: this.packageConfig.id,
      name: this.packageConfig.name,
      packageDirectory,
      generatorBundle: rootBundle,
    };
  }

  getTasks(): PackageTasks {
    return {
      build: [],
      dev: ['watch'],
      watch: ['watch'],
    };
  }
}

export const transactionalLibCompilerCreator: LibraryCompilerCreator = {
  name: transactionalLibDefinitionSchemaEntry.name,
  createCompiler: (definitionContainer, packageConfig) =>
    new TransactionalLibPackageCompiler(definitionContainer, packageConfig),
};
