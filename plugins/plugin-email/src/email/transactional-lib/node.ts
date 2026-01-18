import {
  createPluginModule,
  libraryTypeSpec,
} from '@baseplate-dev/project-builder-lib';

import { transactionalLibCompilerCreator } from './compilers/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    libraryType: libraryTypeSpec,
  },
  initialize: ({ libraryType }) => {
    libraryType.compilerCreators.add(transactionalLibCompilerCreator);
  },
});
