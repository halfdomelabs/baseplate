import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  userSessionTypesGenerator,
} from '@halfdomelabs/fastify-generators';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@halfdomelabs/project-builder-lib';
import {
  authIdentifyGenerator,
  reactRoutesGenerator,
} from '@halfdomelabs/react-generators';

import type { Auth0PluginDefinition } from './schema/plugin-definition';

import {
  auth0ApolloGenerator,
  auth0CallbackGenerator,
  auth0ComponentsGenerator,
  auth0HooksGenerator,
  auth0ModuleGenerator,
  reactAuth0Generator,
} from '../generators';

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
            userModelName: definitionContainer.nameFromId(
              auth.userAccountModelRef,
            ),
            includeManagement: true,
          }),
          userSessionTypes: userSessionTypesGenerator({}),
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginId,
      appType: webAppEntryType,
      compile: ({ projectDefinition, appCompiler }) => {
        const auth = PluginUtils.configByIdOrThrow(
          projectDefinition,
          pluginId,
        ) as Auth0PluginDefinition;

        appCompiler.addChildrenToFeature(
          auth.authFeatureRef,

          {
            auth: reactAuth0Generator({
              callbackPath: 'auth/auth0-callback',
            }),
            authHooks: auth0HooksGenerator({}),
            authIdentify: authIdentifyGenerator({}),
            auth0Apollo: auth0ApolloGenerator({}),
            auth0Components: auth0ComponentsGenerator({}),
            auth0Callback: reactRoutesGenerator({
              id: 'auth',
              name: 'auth',
              children: {
                auth: auth0CallbackGenerator({}),
              },
            }),
          },
        );
      },
    });

    return {};
  },
});
