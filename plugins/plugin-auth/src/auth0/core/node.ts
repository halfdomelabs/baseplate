import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';

import {
  createCommonBackendAuthModuleGenerators,
  createCommonBackendAuthRootGenerators,
  createCommonWebAuthGenerators,
} from '#src/common/index.js';

import type { Auth0PluginDefinition } from './schema/plugin-definition.js';

import {
  auth0ApolloGenerator,
  auth0HooksGenerator,
  auth0ModuleGenerator,
  auth0PagesGenerator,
  reactAuth0Generator,
} from '../generators/index.js';

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
        ) as Auth0PluginDefinition;

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          ...createCommonBackendAuthModuleGenerators({ roles: auth.roles }),
          auth0Module: auth0ModuleGenerator({
            userModelName: definitionContainer.nameFromId(auth.modelRefs.user),
            includeManagement: true,
          }),
        });

        appCompiler.addRootChildren(createCommonBackendAuthRootGenerators());
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginId,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          ...createCommonWebAuthGenerators(),
          auth: reactAuth0Generator({}),
          authHooks: auth0HooksGenerator({}),
          auth0Apollo: auth0ApolloGenerator({}),
          auth0Callback: reactRoutesGenerator({
            name: 'auth',
            children: {
              auth: auth0PagesGenerator({}),
            },
          }),
        });
      },
    });

    return {};
  },
});
