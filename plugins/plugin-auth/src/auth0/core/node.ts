import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  pothosAuthGenerator,
  userSessionTypesGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  adminAppEntryType,
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import {
  authIdentifyGenerator,
  reactRoutesGenerator,
} from '@baseplate-dev/react-generators';

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
          authContext: authContextGenerator({}),
          authPlugin: authPluginGenerator({}),
          authRoles: authRolesGenerator({
            roles: auth.roles.map((r) => ({
              name: r.name,
              comment: r.comment,
              builtIn: r.builtIn,
            })),
          }),
          auth0Module: auth0ModuleGenerator({
            userModelName: definitionContainer.nameFromId(auth.modelRefs.user),
            includeManagement: true,
          }),
          userSessionTypes: userSessionTypesGenerator({}),
        });

        appCompiler.addRootChildren({
          pothosAuth: pothosAuthGenerator({}),
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginId,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          auth: reactAuth0Generator({}),
          authHooks: auth0HooksGenerator({}),
          authIdentify: authIdentifyGenerator({}),
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
    appCompiler.registerAppCompiler({
      pluginId,
      appType: adminAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          auth: reactAuth0Generator({}),
          authHooks: auth0HooksGenerator({}),
          authIdentify: authIdentifyGenerator({}),
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
