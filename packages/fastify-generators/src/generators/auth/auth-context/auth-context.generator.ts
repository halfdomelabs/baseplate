import {
  projectScope,
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

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-maps.js';
import {
  appModuleProvider,
  loggerServiceConfigProvider,
} from '#src/generators/core/index.js';
import { requestServiceContextConfigProvider } from '#src/generators/core/request-service-context/request-service-context.generator.js';
import { serviceContextConfigProvider } from '#src/generators/core/service-context/service-context.generator.js';

import { authRolesImportsProvider } from '../auth-roles/generated/ts-import-maps.js';
import {
  authContextImportsProvider,
  createAuthContextImports,
} from './generated/ts-import-maps.js';
import { AUTH_AUTH_CONTEXT_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const authContextGenerator = createGenerator({
  name: 'auth/auth-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
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
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
      },
      exports: {
        authContextImports: authContextImportsProvider.export(projectScope),
      },
      run({
        serviceContextConfig,
        appModule,
        typescriptFile,
        errorHandlerServiceImports,
        authRolesImports,
      }) {
        const authContextImports = createAuthContextImports(
          appModule.getModuleFolder(),
        );

        return {
          providers: {
            authContextImports,
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: AUTH_AUTH_CONTEXT_TS_TEMPLATES.mainGroup,
                baseDirectory: appModule.getModuleFolder(),
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

export { authContextImportsProvider } from './generated/ts-import-maps.js';
