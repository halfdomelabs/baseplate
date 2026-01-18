import {
  appCompilerSpec,
  backendAppEntryType,
  buildPackageName,
  createPluginModule,
  LibraryUtils,
} from '@baseplate-dev/project-builder-lib';

import { TRANSACTIONAL_LIB_TYPE } from '../transactional-lib/index.js';
import { emailModuleGenerator } from './generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ appCompiler, projectDefinition }) => {
        const transactionalLibDefinition = LibraryUtils.byUniqueTypeOrThrow(
          projectDefinition,
          TRANSACTIONAL_LIB_TYPE,
        );
        appCompiler.addRootChildren({
          emailModule: emailModuleGenerator({
            transactionalLibPackageName: buildPackageName(
              projectDefinition.settings.general,
              transactionalLibDefinition.name,
            ),
          }),
        });
      },
    });
  },
});
