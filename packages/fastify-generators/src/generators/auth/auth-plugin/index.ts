import {
  nodeProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { authContextProvider } from '../auth-context/index.js';
import { userSessionServiceProvider } from '../providers.js';
import { userSessionTypesProvider } from '../user-session-types/index.js';

const descriptorSchema = z.object({});

const AuthPluginGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    appModule: appModuleProvider,
    authContext: authContextProvider,
    userSessionService: userSessionServiceProvider,
    userSessionTypes: userSessionTypesProvider,
    node: nodeProvider,
  },
  exports: {},
  createGenerator(
    descriptor,
    {
      typescript,
      appModule,
      authContext,
      userSessionService,
      userSessionTypes,
      node,
    },
  ) {
    const authPluginPath = path.join(
      appModule.getModuleFolder(),
      'plugins/auth.plugin.ts',
    );
    node.addPackages({
      '@fastify/request-context': '6.0.1',
    });

    return {
      getProviders: () => ({
        authPlugin: {},
      }),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'plugins/auth.plugin.ts',
            destination: authPluginPath,
            importMappers: [authContext, userSessionService, userSessionTypes],
          }),
        );
      },
    };
  },
});

export default AuthPluginGenerator;
