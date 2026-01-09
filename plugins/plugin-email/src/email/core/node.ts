import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

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
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          emailModule: emailModuleGenerator({}),
        });
      },
    });
  },
});
