import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  pothosAuthGenerator,
  userSessionTypesGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { authIdentifyGenerator } from '@baseplate-dev/react-generators';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

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
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          authIdentify: authIdentifyGenerator({}),
        });
      },
    });

    return {};
  },
});
