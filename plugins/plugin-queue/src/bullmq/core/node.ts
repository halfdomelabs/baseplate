import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import { bullmqGenerator } from './generators/bullmq/bullmq.generator.js';

export default createPlatformPluginExport({
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  exports: {},
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          bullmq: bullmqGenerator({}),
        });
      },
    });

    return {};
  },
});
