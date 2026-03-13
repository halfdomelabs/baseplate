import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import { apolloSentryGenerator } from './generators/apollo-sentry/index.js';
import { fastifySentryGenerator } from './generators/fastify-sentry/index.js';
import { pothosSentryGenerator } from './generators/pothos-sentry/index.js';
import { reactSentryGenerator } from './generators/react-sentry/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      {
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ appCompiler }) => {
          appCompiler.addRootChildren({
            sentry: fastifySentryGenerator({}),
            pothosSentry: pothosSentryGenerator({}),
          });
        },
      },
      {
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler }) => {
          appCompiler.addRootChildren({
            reactSentry: reactSentryGenerator({}),
            apolloSentry: apolloSentryGenerator({}),
          });
        },
      },
    );
  },
});
