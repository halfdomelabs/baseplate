import {
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceConfigProvider } from '#src/generators/core/index.js';
import { requestServiceContextConfigProvider } from '#src/generators/core/request-service-context/index.js';
import { serviceContextConfigProvider } from '#src/generators/core/service-context/index.js';

import { authRolesImportsProvider } from '../auth-roles/index.js';
import { AUTH_AUTH_CONTEXT_GENERATED } from './generated/index.js';
import { authContextImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({});

export const authContextGenerator = createGenerator({
  name: 'auth/auth-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_AUTH_CONTEXT_GENERATED.paths.task,
    imports: AUTH_AUTH_CONTEXT_GENERATED.imports.task,
    requestServiceContextConfig: createProviderTask(
      requestServiceContextConfigProvider,
      (requestServiceContextConfig) => {
        requestServiceContextConfig.contextPassthroughs.set('auth', {
          name: 'auth',
          creator: (req) => tsCodeFragment(`${req}.auth`),
        });
      },
    ),
    loggerSetup: createGeneratorTask({
      dependencies: {
        loggerServiceConfig: loggerServiceConfigProvider,
      },
      run({ loggerServiceConfig }) {
        loggerServiceConfig.mixins.set(
          'userId',
          tsCodeFragment(
            "requestContext.get('userId')",
            tsImportBuilder()
              .named('requestContext')
              .from('@fastify/request-context'),
          ),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        serviceContextConfig: serviceContextConfigProvider,
        authRolesImports: authRolesImportsProvider,
        typescriptFile: typescriptFileProvider,
        authContextImports: authContextImportsProvider,
        paths: AUTH_AUTH_CONTEXT_GENERATED.paths.provider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
      },
      run({
        serviceContextConfig,
        typescriptFile,
        authContextImports,
        paths,
        errorHandlerServiceImports,
        authRolesImports,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroupV2({
                group: AUTH_AUTH_CONTEXT_GENERATED.templates.mainGroup,
                paths,
                importMapProviders: {
                  authRolesImports,
                  errorHandlerServiceImports,
                },
              }),
            );

            serviceContextConfig.contextFields.set('auth', {
              type: authContextImports.AuthContext.typeFragment(),
              setter: 'auth',
              creatorArguments: [
                {
                  name: 'auth',
                  type: authContextImports.AuthContext.typeFragment(),
                  testDefault: TsCodeUtils.template`${authContextImports.createAuthContextFromSessionInfo.fragment()}(undefined)`,
                },
              ],
            });
          },
        };
      },
    }),
  }),
});

// Re-export provider is now handled by the new imports system
