import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';

import {
  betterAuthHooksGenerator,
  betterAuthModuleGenerator,
  betterAuthPagesGenerator,
  reactBetterAuthGenerator,
} from '../generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, appDefinition, appCompiler }) => {
          const auth = getAuthPluginDefinition(projectDefinition);

          // Get web app ports
          const webApps = projectDefinition.apps.filter(
            (app) => app.type === 'web',
          );
          const devWebPorts = webApps.map((app) => app.devPort);

          appCompiler.addChildrenToFeature(auth.authFeatureRef, {
            betterAuthModule: betterAuthModuleGenerator({
              devWebPorts,
              devBackendPort: appDefinition.devPort,
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
