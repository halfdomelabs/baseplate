import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  pothosAuthGenerator,
  prismaAuthorizerUtilsGenerator,
  userSessionTypesGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import {
  authErrorsGenerator,
  authIdentifyGenerator,
} from '@baseplate-dev/react-generators';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

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
          const auth = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
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
            userSessionTypes: userSessionTypesGenerator({}),
          });

          appCompiler.addRootChildren({
            pothosAuth: pothosAuthGenerator({}),
            authorizerUtils: prismaAuthorizerUtilsGenerator({}),
          });
        },
      },
      {
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler }) => {
          appCompiler.addRootChildren({
            authIdentify: authIdentifyGenerator({}),
            authErrors: authErrorsGenerator({}),
          });
        },
      },
    );
  },
});
