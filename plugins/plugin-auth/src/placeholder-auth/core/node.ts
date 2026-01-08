import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import { getAuthPluginDefinition } from '#src/auth/index.js';

import {
  placeholderAuthHooksGenerator,
  placeholderAuthModuleGenerator,
  placeholderReactAuthGenerator,
} from './generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    // register backend compiler
    appCompiler.compilers.push(
      {
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, appCompiler }) => {
          const authDefinition = getAuthPluginDefinition(projectDefinition);

          appCompiler.addChildrenToFeature(authDefinition.authFeatureRef, {
            authModule: placeholderAuthModuleGenerator({}),
          });
        },
      },
      {
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler }) => {
          appCompiler.addRootChildren({
            reactAuth: placeholderReactAuthGenerator({}),
            authHooks: placeholderAuthHooksGenerator({}),
          });
        },
      },
    );
  },
});
