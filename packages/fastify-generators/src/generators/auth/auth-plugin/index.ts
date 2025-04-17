import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';

import { userSessionServiceProvider } from '../_providers/index.js';
import { authContextProvider } from '../auth-context/auth-context.generator.js';
import { userSessionTypesProvider } from '../user-session-types/index.js';

const descriptorSchema = z.object({});

export const authPluginGenerator = createGenerator({
  name: 'auth/auth-plugin',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@fastify/request-context',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        appModule: appModuleProvider,
        authContext: authContextProvider,
        userSessionService: userSessionServiceProvider,
        userSessionTypes: userSessionTypesProvider,
      },
      run({
        typescript,
        appModule,
        authContext,
        userSessionService,
        userSessionTypes,
      }) {
        const [authPluginImport, authPluginPath] = makeImportAndFilePath(
          appModule.getModuleFolder(),
          'plugins/auth.plugin.ts',
        );
        appModule.registerFieldEntry(
          'plugins',
          TypescriptCodeUtils.createExpression(
            'authPlugin',
            `import { authPlugin } from '${authPluginImport}'`,
          ),
        );

        return {
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
    }),
  }),
});
