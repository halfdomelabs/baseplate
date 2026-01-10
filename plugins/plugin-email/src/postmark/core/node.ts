import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { postmarkGenerator } from './generators/postmark/postmark.generator.js';

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
          postmark: postmarkGenerator({}),
        });
      },
    });
  },
});
