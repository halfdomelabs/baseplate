import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { userSessionServiceProvider } from '../_providers/index.js';
import { authContextProvider } from '../auth-context/index.js';
import { userSessionTypesProvider } from '../user-session-types/index.js';

const descriptorSchema = z.object({});

export const authPluginGenerator = createGenerator({
  name: 'auth/auth-plugin',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
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
          providers: {
            authPlugin: {},
          },
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
