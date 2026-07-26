import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { getEmailPluginDefinition } from '#src/email/utils/get-email-plugin-definition.js';

import { resendGenerator } from './generators/resend/resend.generator.js';

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

        appCompiler.addChildrenToFeature(email.emailFeatureRef, {
          resend: resendGenerator({}),
        });
      },
    });
  },
});
