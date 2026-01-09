import type {
  BaseLibraryDefinition,
  PackageCompiler,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { libraryTypeSpec } from '@baseplate-dev/project-builder-lib';

export function createLibraryCompilerFromSpec(
  definitionContainer: ProjectDefinitionContainer,
  packageConfig: BaseLibraryDefinition,
): PackageCompiler {
  const typeSpec = definitionContainer.pluginStore.use(libraryTypeSpec);
  const compilerCreator = typeSpec.compilerCreators.get(packageConfig.type);
  if (!compilerCreator) {
    throw new Error(`Unknown library type: ${packageConfig.type}`);
  }
  return compilerCreator.createCompiler(definitionContainer, packageConfig);
}
