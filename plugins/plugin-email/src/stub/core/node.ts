import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import { getEmailPluginDefinition } from '#src/email/utils/get-email-plugin-definition.js';

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
        const email = getEmailPluginDefinition(projectDefinition);
        const stubDefinition = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as StubPluginDefinition;

        appCompiler.addChildrenToFeature(email.emailFeatureRef, {
          stub: stubGenerator({
            providerName: stubDefinition.stubOptions.providerName,
          }),
        });
      },
    });
  },
});
