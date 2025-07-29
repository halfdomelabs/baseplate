import {
  appModuleGenerator,
  passwordHasherServiceGenerator,
} from '@baseplate-dev/fastify-generators';
import {
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

import { authApolloGenerator } from './generators/auth-apollo/auth-apollo.generator.js';
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
  initialize: ({ appCompiler }, { pluginKey }) => {
    // register backend compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
        const auth = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
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

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          ...createCommonWebAuthGenerators(),
          authApollo: authApolloGenerator({}),
          reactAuth: reactAuthGenerator({}),
          authHooks: authHooksGenerator({}),
          reactSession: reactSessionGenerator({}),
          authRoutes: authRoutesGenerator({}),
        });
      },
    });

    return {};
  },
});
