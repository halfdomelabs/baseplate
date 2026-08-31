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
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';

import type { BetterAuthPluginDefinition } from './schema/plugin-definition.js';

import {
  betterAuthAdminModuleGenerator,
  betterAuthEmailTemplatesGenerator,
  betterAuthHooksGenerator,
  betterAuthModuleGenerator,
  betterAuthPagesGenerator,
  betterAuthSeedInitialUserGenerator,
  reactBetterAuthGenerator,
} from '../generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    emailTemplate: emailTemplateSpec,
  },
  initialize: ({ appCompiler, emailTemplate }, { pluginKey }) => {
    // Register auth email templates with the transactional lib
    emailTemplate.generators.push(betterAuthEmailTemplatesGenerator({}));

    appCompiler.compilers.push(
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({
          projectDefinition,
          appDefinition,
          appCompiler,
          definitionContainer,
        }) => {
          const auth = getAuthPluginDefinition(projectDefinition);

          const { webApps: webAppUrls } = getAppUrls(projectDefinition);
          const authWebApp = webAppUrls.find((app) => app.isDefault);
          if (!authWebApp) {
            throw new Error(
              'Unable to determine which web app auth emails should link to',
            );
          }

          const betterAuthDefinition = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as BetterAuthPluginDefinition;

          const additionalAdminRoles =
            betterAuthDefinition.additionalUserAdminRoles.map((role) =>
              definitionContainer.nameFromId(role),
            );
          // 'admin' is always included since it is now a built-in role guaranteed to exist
          const adminRoles = [...new Set(['admin', ...additionalAdminRoles])];

          appCompiler.addChildrenToFeature(auth.authFeatureRef, {
            seedInitialUser: betterAuthSeedInitialUserGenerator({
              initialUserRoles: ['admin'],
            }),
            betterAuthModule: betterAuthModuleGenerator({
              devBackendPort: appDefinition.devPort,
              webAppName: authWebApp.name,
            }),
            betterAuthAdminModule: betterAuthAdminModuleGenerator({
              adminRoles,
            }),
          });
        },
      }),
      pluginAppCompiler({
        pluginKey,
        appType: webAppEntryType,
        compile: ({ appCompiler, projectDefinition }) => {
          const auth = getAuthPluginDefinition(projectDefinition);

          appCompiler.addRootChildren({
            auth: reactBetterAuthGenerator({}),
            authHooks: betterAuthHooksGenerator({
              authRoles: auth.roles.map((role) => role.name),
            }),
            betterAuthPages: reactRoutesGenerator({
              name: 'auth',
              children: {
                auth: betterAuthPagesGenerator({}),
              },
            }),
          });
        },
      }),
    );
  },
});
