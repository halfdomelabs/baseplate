import {
  createPluginModule,
  libraryTypeSpec,
} from '@baseplate-dev/project-builder-lib';

import { nodeLibraryCompilerCreator } from '#src/compiler/index.js';

/**
 * Core module that registers package compilers.
 *
 * The schemas are already pre-populated in packageTypeSpec from project-builder-lib.
 * This module registers the compile implementations that require server-side dependencies.
 */
export const libraryTypeCoreModule = createPluginModule({
  name: 'package-compiler',
  dependencies: {
    libraryType: libraryTypeSpec,
  },
  initialize: ({ libraryType }) => {
    libraryType.compilerCreators.add(nodeLibraryCompilerCreator);
  },
});
