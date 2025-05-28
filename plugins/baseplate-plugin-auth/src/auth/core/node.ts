import {
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  placeholderAuthServiceGenerator,
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
  placeholderAuthHooksGenerator,
} from '@halfdomelabs/react-generators';

import type { AuthPluginDefinition } from './schema/plugin-definition';

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
          placeholderUserSessionService: placeholderAuthServiceGenerator({}),
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
          authIdentify: authIdentifyGenerator({}),
          authHooks: placeholderAuthHooksGenerator({}),
        });
      },
    });

    return {};
  },
});
