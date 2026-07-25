import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { getEmailPluginDefinition } from '#src/email/utils/index.js';

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
      compile: ({ appCompiler, projectDefinition }) => {
        // Mounted inside the email feature so the adapter is emitted
        // alongside the email module it implements.
        const email = getEmailPluginDefinition(projectDefinition);
        appCompiler.addChildrenToFeature(email.emailFeatureRef, {
          postmark: postmarkGenerator({}),
        });
      },
    });
  },
});
