import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import { pgBossGenerator } from './generators/pg-boss/pg-boss.generator.js';

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
          pgBoss: pgBossGenerator({}),
        });
      },
    });

    return {};
  },
});
