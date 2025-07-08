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
import { placeholderAuthHooksGenerator } from '#src/placeholder-auth/index.js';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { authModuleGenerator, reactAuthGenerator } from './generators/index.js';

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
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const auth = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as AuthPluginDefinition;

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          ...createCommonBackendAuthModuleGenerators({ roles: auth.roles }),
          authModule: authModuleGenerator({
            userSessionModelName: definitionContainer.nameFromId(
              auth.modelRefs.userSession,
            ),
          }),
        });

        appCompiler.addRootChildren(createCommonBackendAuthRootGenerators());
      },
    });

    const sharedWebGenerators = {
      ...createCommonWebAuthGenerators(),
      reactAuth: reactAuthGenerator({}),
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
