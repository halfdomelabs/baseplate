import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { pgBossGenerator } from './generators/pg-boss/pg-boss.generator.js';

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
          pgBoss: pgBossGenerator({}),
        });
      },
    });
  },
});
