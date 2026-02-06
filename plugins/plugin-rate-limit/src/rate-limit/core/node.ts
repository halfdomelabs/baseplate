import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { rateLimitGenerator } from './generators/rate-limit/rate-limit.generator.js';

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
          rateLimit: rateLimitGenerator({}),
        });
      },
    });
  },
});
