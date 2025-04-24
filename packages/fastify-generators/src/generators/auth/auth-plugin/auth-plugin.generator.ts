import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { appModuleProvider } from '@src/generators/core/app-module/app-module.generator.js';

import { userSessionServiceImportsProvider } from '../_providers/index.js';
import { authContextImportsProvider } from '../auth-context/auth-context.generator.js';
import { userSessionTypesImportsProvider } from '../user-session-types/user-session-types.generator.js';
import { AUTH_AUTH_PLUGIN_TS_TEMPLATES } from './generated/ts-templates.js';

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
        typescriptFile: typescriptFileProvider,
        appModule: appModuleProvider,
        authContextImports: authContextImportsProvider,
        userSessionServiceImports: userSessionServiceImportsProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
      },
      run({
        typescriptFile,
        appModule,
        authContextImports,
        userSessionServiceImports,
        userSessionTypesImports,
      }) {
        const authPluginPath = `${appModule.getModuleFolder()}/plugins/auth.plugin.ts`;
        appModule.moduleFields.set(
          'plugins',
          'authPlugin',
          tsCodeFragment(
            'authPlugin',
            tsImportBuilder(['authPlugin']).from(authPluginPath),
          ),
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_PLUGIN_TS_TEMPLATES.authPlugin,
                destination: authPluginPath,
                importMapProviders: {
                  authContextImports,
                  userSessionServiceImports,
                  userSessionTypesImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
