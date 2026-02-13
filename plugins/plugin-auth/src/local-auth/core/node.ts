import {
  appModuleGenerator,
  passwordHasherServiceGenerator,
} from '@baseplate-dev/fastify-generators';
import { emailTemplateSpec } from '@baseplate-dev/plugin-email';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  PluginUtils,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';

import { getAuthPluginDefinition } from '#src/auth/index.js';

import type { LocalAuthPluginDefinition } from './schema/plugin-definition.js';

import { authApolloGenerator } from './generators/auth-apollo/auth-apollo.generator.js';
import { authEmailPasswordGenerator } from './generators/auth-email-password/auth-email-password.generator.js';
import { authEmailTemplatesGenerator } from './generators/auth-email-templates/auth-email-templates.generator.js';
import { authHooksGenerator } from './generators/auth-hooks/auth-hooks.generator.js';
import { authRoutesGenerator } from './generators/auth-routes/auth-routes.generator.js';
import {
  authModuleGenerator,
  reactAuthGenerator,
  seedInitialUserGenerator,
} from './generators/index.js';
import { reactSessionGenerator } from './generators/react-session/react-session.generator.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    emailTemplate: emailTemplateSpec,
  },
  initialize: ({ appCompiler, emailTemplate }, { pluginKey }) => {
    // Register auth email templates with the transactional lib
    emailTemplate.generators.push(authEmailTemplatesGenerator({}));

    // register backend compiler
    appCompiler.compilers.push(
      {
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
      },
      {
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
      },
    );
  },
});
