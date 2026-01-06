import type {
  BasePackageConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import {
  composeNodeGenerator,
  nodeLibraryGenerator,
  vitestGenerator,
} from '@baseplate-dev/core-generators';

import type { PackageTasks } from '../package-compiler.js';
import type { PackageEntry } from '../package-entry.js';

import { buildPackageName, PackageCompiler } from '../package-compiler.js';

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
    const packagesFolder = monorepoSettings?.packagesFolder ?? 'packages';
    return `${packagesFolder}/${this.packageConfig.name}`;
  }
}

/**
 * Compiler for node library packages
 *
 * Generates a TypeScript library package with:
 * - TypeScript compilation using tsc
 * - Vitest testing setup
 * - Package.json with library exports
 */
export class NodeLibraryCompiler extends LibraryCompiler<BasePackageConfig> {
  compile(): PackageEntry {
    const projectDefinition = this.definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;

    const packageName = this.getPackageName();

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${this.packageConfig.name}`,
      packageName,
      description: `Library package for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({ includePlaceholderIndexFile: true }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
      },
    });

    return {
      id: this.packageConfig.id,
      name: this.packageConfig.name,
      packageDirectory: this.getPackageDirectory(),
      generatorBundle: rootBundle,
    };
  }

  getTasks(): PackageTasks {
    return {
      build: ['build'],
      dev: [],
      watch: [],
    };
  }
}
