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
  placeholderAuthHooksGenerator,
} from '@baseplate-dev/react-generators';

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
          authModule: authModuleGenerator({
            userSessionModelName: definitionContainer.nameFromId(
              auth.modelRefs.userSession,
            ),
          }),
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
          reactAuth: reactAuthGenerator({}),
          authIdentify: authIdentifyGenerator({}),
          authHooks: placeholderAuthHooksGenerator({}),
        });
      },
    });
    appCompiler.registerAppCompiler({
      pluginId,
      appType: adminAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          reactAuth: reactAuthGenerator({}),
          authIdentify: authIdentifyGenerator({}),
          authHooks: placeholderAuthHooksGenerator({}),
        });
      },
    });

    return {};
  },
});
