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
  generateCssBlockFromThemeColors,
  generateDefaultTheme,
  LibraryCompiler,
  reactLibraryDefinitionSchemaEntry,
} from '@baseplate-dev/project-builder-lib';
import {
  reactComponentsLibraryGenerator,
  reactLibraryGenerator,
  reactTailwindGenerator,
} from '@baseplate-dev/react-generators';

class ReactLibraryPackageCompiler extends LibraryCompiler<BaseLibraryDefinition> {
  compile(): PackageEntry {
    const { packageConfig, definitionContainer } = this;
    const projectDefinition = definitionContainer.definition;
    const generalSettings = projectDefinition.settings.general;
    const themeConfig =
      projectDefinition.settings.theme ?? generateDefaultTheme();

    const packageName = this.getPackageName();
    const packageDirectory = this.getPackageDirectory();

    const isComponentsSource = projectDefinition.apps.some(
      (app) =>
        app.type === 'web' && app.componentsLibraryRef === packageConfig.id,
    );

    const rootBundle = composeNodeGenerator({
      name: `${generalSettings.name}-${packageConfig.name}`,
      packageName,
      description: `React library package for ${generalSettings.name}`,
      version: '1.0.0',
      children: {
        library: nodeLibraryGenerator({
          includePlaceholderIndexFile: !isComponentsSource,
        }),
        vitest: vitestGenerator({ includeTestHelpers: false }),
        reactLibrary: reactLibraryGenerator({}),
        reactTailwind: reactTailwindGenerator({
          includeViteIntegration: false,
          lightColorsCss: generateCssBlockFromThemeColors(
            themeConfig.colors.light,
          ),
          darkColorsCss: generateCssBlockFromThemeColors(
            themeConfig.colors.dark,
          ),
        }),
        ...(isComponentsSource
          ? { reactComponentsLibrary: reactComponentsLibraryGenerator({}) }
          : {}),
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
