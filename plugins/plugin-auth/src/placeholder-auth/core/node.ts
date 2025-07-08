import {
  adminAppEntryType,
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
  initialize: ({ appCompiler }, { pluginId }) => {
    // register backend compiler
    appCompiler.registerAppCompiler({
      pluginId,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, appCompiler }) => {
        const auth = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as PlaceholderAuthPluginDefinition;

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          ...createCommonBackendAuthModuleGenerators({ roles: auth.roles }),
          authModule: placeholderAuthModuleGenerator({}),
        });

        appCompiler.addRootChildren(createCommonBackendAuthRootGenerators());
      },
    });

    const sharedWebGenerators = {
      ...createCommonWebAuthGenerators(),
      reactAuth: placeholderReactAuthGenerator({}),
      authHooks: placeholderAuthHooksGenerator({}),
    };

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginId,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren(sharedWebGenerators);
      },
    });
    appCompiler.registerAppCompiler({
      pluginId,
      appType: adminAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren(sharedWebGenerators);
      },
    });

    return {};
  },
});
