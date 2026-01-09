import {
  createPluginModule,
  libraryTypeSpec,
} from '@baseplate-dev/project-builder-lib';

import { nodeLibraryWebConfig } from '#src/routes/apps/packages.$key/-components/node-library-edit.js';

/**
 * Core module that registers library type web configurations.
 *
 * Web configs provide React components for editing each library type.
 */
export const libraryTypeWebConfigsCoreModule = createPluginModule({
  name: 'library-type-web-configs',
  dependencies: {
    libraryType: libraryTypeSpec,
  },
  initialize: ({ libraryType }) => {
    libraryType.webConfigs.add(nodeLibraryWebConfig);
  },
});
