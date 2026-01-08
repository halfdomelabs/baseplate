import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  webAppEntryType,
} from '@baseplate-dev/project-builder-lib';
import { reactRoutesGenerator } from '@baseplate-dev/react-generators';

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';

import {
  auth0ApolloGenerator,
  auth0HooksGenerator,
  auth0ModuleGenerator,
  auth0PagesGenerator,
  reactAuth0Generator,
} from '../generators/index.js';

export default createPluginModule({
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  exports: {},
  initialize: ({ appCompiler }, { pluginKey }) => {
    // register backend compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ projectDefinition, appCompiler }) => {
        const auth = getAuthPluginDefinition(projectDefinition);

        appCompiler.addChildrenToFeature(auth.authFeatureRef, {
          auth0Module: auth0ModuleGenerator({
            includeManagement: true,
          }),
        });
      },
    });

    // register web compiler
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: webAppEntryType,
      compile: ({ appCompiler, projectDefinition }) => {
        const auth = getAuthPluginDefinition(projectDefinition);

        appCompiler.addRootChildren({
          auth: reactAuth0Generator({}),
          authHooks: auth0HooksGenerator({
            authRoles: auth.roles.map((role) => role.name),
          }),
          auth0Apollo: auth0ApolloGenerator({}),
          auth0Callback: reactRoutesGenerator({
            name: 'auth',
            children: {
              auth: auth0PagesGenerator({}),
            },
          }),
        });
      },
    });

    return {};
  },
});
