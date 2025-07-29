import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import {
  createCommonBackendAuthModuleGenerators,
  createCommonBackendAuthRootGenerators,
  createCommonWebAuthGenerators,
} from '#src/common/index.js';

import type { PlaceholderAuthPluginDefinition } from './schema/plugin-definition.js';

import {
  placeholderAuthHooksGenerator,
  placeholderAuthModuleGenerator,
  placeholderReactAuthGenerator,
} from './generators/index.js';

export default createPlatformPluginExport({
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
        const auth = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as PlaceholderAuthPluginDefinition;

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          ...createCommonBackendAuthModuleGenerators({ roles: auth.roles }),
          authModule: placeholderAuthModuleGenerator({}),
        });

        appCompiler.addRootChildren(createCommonBackendAuthRootGenerators());
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          ...createCommonWebAuthGenerators(),
          reactAuth: placeholderReactAuthGenerator({}),
          authHooks: placeholderAuthHooksGenerator({}),
        });
      },
    });

    return {};
  },
});
