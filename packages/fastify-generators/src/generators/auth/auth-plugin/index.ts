import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithTasks } from '@halfdomelabs/sync';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { authContextProvider } from '../auth-context/index.js';
import { userSessionServiceProvider } from '../providers.js';
import { userSessionTypesProvider } from '../user-session-types/index.js';

const descriptorSchema = z.object({});

const AuthPluginGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        appModule: appModuleProvider,
        authContext: authContextProvider,
        userSessionService: userSessionServiceProvider,
        userSessionTypes: userSessionTypesProvider,
        node: nodeProvider,
      },
      run({
        typescript,
        appModule,
        authContext,
        userSessionService,
        userSessionTypes,
        node,
      }) {
        const [authPluginImport, authPluginPath] = makeImportAndFilePath(
          appModule.getModuleFolder(),
          'plugins/auth.plugin.ts',
        );
        node.addPackages({
          '@fastify/request-context': '6.0.1',
        });

        appModule.registerFieldEntry(
          'plugins',
          TypescriptCodeUtils.createExpression(
            'authPlugin',
            `import { authPlugin } from '${authPluginImport}'`,
          ),
        );

        return {
          getProviders: () => ({
            authPlugin: {},
          }),
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'plugins/auth.plugin.ts',
                destination: authPluginPath,
                importMappers: [
                  authContext,
                  userSessionService,
                  userSessionTypes,
                ],
              }),
            );
          },
        };
      },
    });
  },
});

export default AuthPluginGenerator;
