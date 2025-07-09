import {
  appModuleGenerator,
  passwordHasherServiceGenerator,
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
  createCommonBackendAuthModuleGenerators,
  createCommonBackendAuthRootGenerators,
  createCommonWebAuthGenerators,
} from '#src/common/index.js';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { authEmailPasswordGenerator } from './generators/auth-email-password/auth-email-password.generator.js';
import { authHooksGenerator } from './generators/auth-hooks/auth-hooks.generator.js';
import { authRoutesGenerator } from './generators/auth-routes/auth-routes.generator.js';
import { authModuleGenerator, reactAuthGenerator } from './generators/index.js';
import { reactSessionGenerator } from './generators/react-session/react-session.generator.js';

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
            userModelName: definitionContainer.nameFromId(auth.modelRefs.user),
          }),
          emailPassword: appModuleGenerator({
            id: 'email-password',
            name: 'password',
            children: {
              module: authEmailPasswordGenerator({}),
              hasher: passwordHasherServiceGenerator({}),
            },
          }),
        });

        appCompiler.addRootChildren(createCommonBackendAuthRootGenerators());
      },
    });

    const sharedWebGenerators = {
      ...createCommonWebAuthGenerators(),
      reactAuth: reactAuthGenerator({}),
      authHooks: authHooksGenerator({}),
      reactSession: reactSessionGenerator({}),
      authRoutes: authRoutesGenerator({}),
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
