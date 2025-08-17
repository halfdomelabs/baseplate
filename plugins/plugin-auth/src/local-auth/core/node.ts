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

import { getAuthPluginDefinition } from '#src/auth/index.js';

import type { LocalAuthPluginDefinition } from './schema/plugin-definition.js';

import { authApolloGenerator } from './generators/auth-apollo/auth-apollo.generator.js';
import { authEmailPasswordGenerator } from './generators/auth-email-password/auth-email-password.generator.js';
import { authHooksGenerator } from './generators/auth-hooks/auth-hooks.generator.js';
import { authRoutesGenerator } from './generators/auth-routes/auth-routes.generator.js';
import {
  authModuleGenerator,
  reactAuthGenerator,
  seedInitialUserGenerator,
} from './generators/index.js';
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
        const localAuthDefinition = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as LocalAuthPluginDefinition;

        const authDefinition = getAuthPluginDefinition(projectDefinition);

        appCompiler.addChildrenToFeature(authDefinition.authFeatureRef, {
          seedInitialUser: seedInitialUserGenerator({
            initialUserRoles:
              localAuthDefinition.initialUserRoles?.map((role) =>
                definitionContainer.nameFromId(role),
              ) ?? [],
          }),
          authModule: authModuleGenerator({
            userSessionModelName: definitionContainer.nameFromId(
              localAuthDefinition.modelRefs.userSession,
            ),
            userModelName: definitionContainer.nameFromId(
              localAuthDefinition.modelRefs.user,
            ),
            userAdminRoles:
              localAuthDefinition.userAdminRoles?.map((role) =>
                definitionContainer.nameFromId(role),
              ) ?? [],
          }),
          emailPassword: appModuleGenerator({
            id: 'email-password',
            name: 'password',
            children: {
              module: authEmailPasswordGenerator({
                userModelName: definitionContainer.nameFromId(
                  localAuthDefinition.modelRefs.user,
                ),
                adminRoles:
                  localAuthDefinition.userAdminRoles?.map((role) =>
                    definitionContainer.nameFromId(role),
                  ) ?? [],
              }),
              hasher: passwordHasherServiceGenerator({}),
            },
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
