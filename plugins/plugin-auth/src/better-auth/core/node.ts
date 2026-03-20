import { emailTemplateSpec } from '@baseplate-dev/plugin-email';
import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
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
          const betterAuthDefinition = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as BetterAuthPluginDefinition;

          // Get web app ports
          const webApps = projectDefinition.apps.filter(
            (app) => app.type === 'web',
          );
          const devWebPorts = webApps.map((app) => app.devPort);
          const devWebDomainPort =
            devWebPorts[0] ??
            projectDefinition.settings.general.portOffset + 30;

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
              devWebPorts,
              devBackendPort: appDefinition.devPort,
              devWebDomainPort,
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
