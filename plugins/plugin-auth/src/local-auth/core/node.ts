import {
  appModuleGenerator,
  passwordHasherServiceGenerator,
} from '@baseplate-dev/fastify-generators';
import { emailTemplateSpec } from '@baseplate-dev/plugin-email';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  getAppUrls,
  pluginAppCompiler,
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
import { getLocalAuthWebAppData } from './schema/web-app-schema.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    emailTemplate: emailTemplateSpec,
  },
  initialize: ({ appCompiler, emailTemplate }, { pluginKey }) => {
    // Register auth email templates with the transactional lib. Resolved lazily
    // so the sign-in code email is only emitted when that flow is enabled.
    emailTemplate.generators.push(({ projectDefinition }) => {
      const { emailOtp } = PluginUtils.configByKeyOrThrow(
        projectDefinition,
        pluginKey,
      ) as LocalAuthPluginDefinition;
      return authEmailTemplatesGenerator({ emailOtp });
    });

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

          const webApps = projectDefinition.apps.filter(
            (app) => app.type === 'web',
          );

          const { webApps: webAppUrls } = getAppUrls(projectDefinition);
          const authWebApp = webAppUrls.find((app) => app.isDefault);
          if (!authWebApp) {
            throw new Error(
              'Unable to determine which web app auth emails should link to',
            );
          }

          // The register mutation is shared by every web app on this
          // backend, so it can only be dropped once none of them allow
          // self-service registration.
          const disableRegistration =
            webApps.length > 0 &&
            webApps.every(
              (app) =>
                getLocalAuthWebAppData(app, pluginKey)?.disableRegistration ??
                false,
            );

          const additionalAdminRoles =
            localAuthDefinition.additionalUserAdminRoles.map((role) =>
              definitionContainer.nameFromId(role),
            );
          // 'admin' is always included since it is now a built-in role guaranteed to exist
          const adminRoles = [...new Set(['admin', ...additionalAdminRoles])];

          appCompiler.addChildrenToFeature(authDefinition.authFeatureRef, {
            seedInitialUser: seedInitialUserGenerator({
              initialUserRoles: ['admin'],
            }),
            authModule: authModuleGenerator({
              userAdminRoles: adminRoles,
              emailOtp: localAuthDefinition.emailOtp,
            }),
            emailPassword: appModuleGenerator({
              id: 'email-password',
              name: 'password',
              children: {
                module: authEmailPasswordGenerator({
                  adminRoles,
                  webAppName: authWebApp.name,
                  requireNameOnRegistration:
                    localAuthDefinition.requireNameOnRegistration,
                  emailOtp: localAuthDefinition.emailOtp,
                  disableRegistration,
                }),
                hasher: passwordHasherServiceGenerator({}),
              },
            }),
          });
        },
      },
      pluginAppCompiler({
        pluginKey,
        appType: webAppEntryType,
        compile: ({ projectDefinition, appDefinition, appCompiler }) => {
          const localAuthDefinition = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as LocalAuthPluginDefinition;

          const disableRegistration =
            getLocalAuthWebAppData(appDefinition, pluginKey)
              ?.disableRegistration ?? false;

          appCompiler.addRootChildren({
            authApollo: authApolloGenerator({}),
            reactAuth: reactAuthGenerator({}),
            authHooks: authHooksGenerator({}),
            reactSession: reactSessionGenerator({}),
            authRoutes: authRoutesGenerator({
              requireNameOnRegistration:
                localAuthDefinition.requireNameOnRegistration,
              emailOtp: localAuthDefinition.emailOtp,
              disableRegistration,
            }),
          });
        },
      }),
    );
  },
});
