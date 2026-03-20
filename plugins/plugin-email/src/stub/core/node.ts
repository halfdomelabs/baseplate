import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { StubPluginDefinition } from './schema/plugin-definition.js';

import { stubGenerator } from './generators/stub/stub.generator.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, appCompiler }) => {
        const stubDefinition = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as StubPluginDefinition;

        appCompiler.addRootChildren({
          stub: stubGenerator({
            providerName: stubDefinition.stubOptions.providerName,
          }),
        });
      },
    });
  },
});
