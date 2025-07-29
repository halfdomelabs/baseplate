import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';

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
  initialize: ({ appCompiler }, { pluginKey }) => {
    // register backend compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const auth0PluginDefinition = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as Auth0PluginDefinition;

        const auth = getAuthPluginDefinition(projectDefinition);

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          auth0Module: auth0ModuleGenerator({
            userModelName: definitionContainer.nameFromId(
              auth0PluginDefinition.modelRefs.user,
            ),
            includeManagement: true,
          }),
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
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
