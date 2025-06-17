import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleProvider } from '#src/generators/core/app-module/index.js';

import { userSessionServiceImportsProvider } from '../_providers/index.js';
import { authContextImportsProvider } from '../auth-context/index.js';
import { userSessionTypesImportsProvider } from '../user-session-types/index.js';
import { AUTH_AUTH_PLUGIN_GENERATED } from './generated/index.js';

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
    paths: AUTH_AUTH_PLUGIN_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        appModule: appModuleProvider,
        authContextImports: authContextImportsProvider,
        userSessionServiceImports: userSessionServiceImportsProvider,
        userSessionTypesImports: userSessionTypesImportsProvider,
        paths: AUTH_AUTH_PLUGIN_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        appModule,
        authContextImports,
        userSessionServiceImports,
        userSessionTypesImports,
        paths,
      }) {
        appModule.moduleFields.set(
          'plugins',
          'authPlugin',
          tsCodeFragment(
            'authPlugin',
            tsImportBuilder(['authPlugin']).from(paths.authPlugin),
          ),
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_PLUGIN_GENERATED.templates.authPlugin,
                destination: paths.authPlugin,
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
