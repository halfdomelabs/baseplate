import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  pothosAuthGenerator,
  userSessionTypesGenerator,
} from '@halfdomelabs/fastify-generators';
import {
  adminAppEntryType,
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

import type { AuthPluginDefinition } from './schema/plugin-definition';

import {
  authApolloGenerator,
  authCallbackGenerator,
  authComponentsGenerator,
  authHooksGenerator,
  authModuleGenerator,
  reactAuthGenerator,
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
        ) as AuthPluginDefinition;

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
          authModule: authModuleGenerator({
            userModelName: definitionContainer.nameFromId(
              auth.userAccountModelRef,
            ),
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
          auth: reactAuthGenerator({
            callbackPath: 'auth/auth-callback',
          }),
          authHooks: authHooksGenerator({}),
          authIdentify: authIdentifyGenerator({}),
          authApollo: authApolloGenerator({}),
          authComponents: authComponentsGenerator({}),
          authCallback: reactRoutesGenerator({
            id: 'auth',
            name: 'auth',
            children: {
              auth: authCallbackGenerator({}),
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
          auth: reactAuthGenerator({
            callbackPath: 'auth/auth-callback',
          }),
          authHooks: authHooksGenerator({}),
          authIdentify: authIdentifyGenerator({}),
          authApollo: authApolloGenerator({}),
          authComponents: authComponentsGenerator({}),
          authCallback: reactRoutesGenerator({
            id: 'auth',
            name: 'auth',
            children: {
              auth: authCallbackGenerator({}),
            },
          }),
        });
      },
    });

    return {};
  },
});
