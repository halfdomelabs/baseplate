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
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  exports: {},
  initialize: ({ appCompiler }, { pluginKey }) => {
    // register backend compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, appCompiler }) => {
        const authDefinition = getAuthPluginDefinition(projectDefinition);

        appCompiler.addChildrenToFeature(authDefinition.authFeatureRef, {
          authModule: placeholderAuthModuleGenerator({}),
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          reactAuth: placeholderReactAuthGenerator({}),
          authHooks: placeholderAuthHooksGenerator({}),
        });
      },
    });

    return {};
  },
});
